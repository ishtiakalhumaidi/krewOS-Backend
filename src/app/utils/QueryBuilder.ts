import {
  IQueryConfig,
  IQueryParams,
  IQueryResult,
  PrismaCountArgs,
  PrismaFindManyArgs,
  PrismaModelDelegate,
  PrismaWhereConditions,
} from "../interfaces/query.interface";

// T = Model Type
export class QueryBuilder<
  T,
  TWhereInput = Record<string, unknown>,
  TInclude = Record<string, unknown>,
> {
  private query: PrismaFindManyArgs;
  private countQuery: PrismaCountArgs;
  private page: number = 1;
  private limit: number = 10;
  private skip: number = 0;
  private sortBy: string = "createdAt";
  private sortOrder: "asc" | "desc" = "desc";
  private selectFields: Record<string, boolean> | undefined;

  constructor(
    private model: PrismaModelDelegate,
    private queryParams: IQueryParams,
    private config: IQueryConfig = {},
  ) {
    this.query = { where: {}, include: {}, orderBy: {}, skip: 0, take: 10 };
    this.countQuery = { where: {} };
  }

  search(): this {
    const { searchTerm } = this.queryParams;
    const { searchableFields } = this.config;

    if (searchTerm && searchableFields && searchableFields.length > 0) {
      const searchConditions: Record<string, unknown>[] = searchableFields.map(
        (field) => {
          if (field.includes(".")) {
            const parts = field.split(".");

            if (parts.length === 2) {
              const [relation, nestedField] = parts;
              return {
                [relation]: {
                  [nestedField]: {
                    contains: searchTerm,
                    mode: "insensitive" as const,
                  },
                },
              };
            } else if (parts.length === 3) {
              const [relation, nestedRelation, nestedField] = parts;
              return {
                [relation]: {
                  some: {
                    [nestedRelation]: {
                      [nestedField]: {
                        contains: searchTerm,
                        mode: "insensitive" as const,
                      },
                    },
                  },
                },
              };
            }
          }
          return {
            [field]: { contains: searchTerm, mode: "insensitive" as const },
          };
        },
      );

      const whereConditions = this.query.where as PrismaWhereConditions;
      whereConditions.OR = searchConditions;

      const countWhereConditions = this.countQuery
        .where as PrismaWhereConditions;
      countWhereConditions.OR = searchConditions;
    }
    return this;
  }

  filter(): this {
    const { filterableFields } = this.config;
    const excludedField = [
      "searchTerm",
      "page",
      "limit",
      "sortBy",
      "sortOrder",
      "fields",
      "include",
    ];

    const filterParams: Record<string, unknown> = {};

    Object.keys(this.queryParams).forEach((key) => {
      if (!excludedField.includes(key)) {
        filterParams[key] = this.queryParams[key];
      }
    });

    const queryWhere = this.query.where as Record<string, unknown>;
    const countQueryWhere = this.countQuery.where as Record<string, unknown>;

    Object.keys(filterParams).forEach((key) => {
      const value = filterParams[key];
      if (value === undefined || value === "") return;

      let fieldName = key;
      let rangeOperator: string | null = null;

      const match = key.match(/^([^[]+)\[([^\]]+)\]$/);
      if (match) {
        fieldName = match[1];
        rangeOperator = match[2];
      }

      const isAllowedField =
        !filterableFields ||
        filterableFields.length === 0 ||
        filterableFields.includes(fieldName);

      // Handle nested relationships (e.g., project.name)
      if (fieldName.includes(".")) {
        if (filterableFields && !filterableFields.includes(fieldName)) return;

        const parts = fieldName.split(".");
        if (parts.length === 2) {
          const [relation, nestedField] = parts;
          if (!queryWhere[relation]) {
            queryWhere[relation] = {};
            countQueryWhere[relation] = {};
          }

          (queryWhere[relation] as Record<string, unknown>)[nestedField] =
            this.parseFilterValue(value);
          (countQueryWhere[relation] as Record<string, unknown>)[nestedField] =
            this.parseFilterValue(value);
          return;
        } else if (parts.length === 3) {
          const [relation, nestedRelation, nestedField] = parts;
          if (!queryWhere[relation]) {
            queryWhere[relation] = { some: {} };
            countQueryWhere[relation] = { some: {} };
          }

          const qSome = (queryWhere[relation] as Record<string, unknown>)
            .some as Record<string, unknown>;
          const cSome = (countQueryWhere[relation] as Record<string, unknown>)
            .some as Record<string, unknown>;

          if (!qSome[nestedRelation]) qSome[nestedRelation] = {};
          if (!cSome[nestedRelation]) cSome[nestedRelation] = {};

          (qSome[nestedRelation] as Record<string, unknown>)[nestedField] =
            this.parseFilterValue(value);
          (cSome[nestedRelation] as Record<string, unknown>)[nestedField] =
            this.parseFilterValue(value);
          return;
        }
      }

      if (!isAllowedField) return;

      // 👉 FIX 2: Process Flat Range Keys (e.g., checkDate[gte]=...)
      if (rangeOperator) {
        if (!queryWhere[fieldName]) {
          queryWhere[fieldName] = {};
          countQueryWhere[fieldName] = {};
        }

        (queryWhere[fieldName] as Record<string, unknown>)[rangeOperator] =
          this.parseFilterValue(value);
        (countQueryWhere[fieldName] as Record<string, unknown>)[rangeOperator] =
          this.parseFilterValue(value);
        return;
      }

      // Range filter parsing (If Express parsed it as a nested object)
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        queryWhere[fieldName] = this.parseRangeFilter(
          value as Record<string, unknown>,
        );
        countQueryWhere[fieldName] = this.parseRangeFilter(
          value as Record<string, unknown>,
        );
        return;
      }

      // Direct value parsing
      queryWhere[fieldName] = this.parseFilterValue(value);
      countQueryWhere[fieldName] = this.parseFilterValue(value);
    });
    return this;
  }

  paginate(): this {
    this.page = Number(this.queryParams.page) || 1;
    this.limit = Number(this.queryParams.limit) || 10;
    this.skip = (this.page - 1) * this.limit;

    this.query.skip = this.skip;
    this.query.take = this.limit;
    return this;
  }

  sort(): this {
    const sortBy = this.queryParams.sortBy || "createdAt";
    this.sortOrder = this.queryParams.sortOrder === "asc" ? "asc" : "desc";

    if (sortBy.includes(".")) {
      const parts = sortBy.split(".");
      if (parts.length === 2) {
        this.query.orderBy = { [parts[0]]: { [parts[1]]: this.sortOrder } };
      } else if (parts.length === 3) {
        this.query.orderBy = {
          [parts[0]]: { [parts[1]]: { [parts[2]]: this.sortOrder } },
        };
      }
    } else {
      this.query.orderBy = { [sortBy]: this.sortOrder };
    }
    return this;
  }

  fields(): this {
    const fieldsParam = this.queryParams.fields;
    if (fieldsParam && typeof fieldsParam === "string") {
      const fieldsArray = fieldsParam.split(",").map((field) => field.trim());
      this.selectFields = {};

      fieldsArray.forEach((field) => {
        if (this.selectFields) this.selectFields[field] = true;
      });

      this.query.select = this.selectFields as Record<
        string,
        boolean | Record<string, unknown>
      >;
      delete this.query.include;
    }
    return this;
  }

  include(relation: TInclude): this {
    if (this.selectFields) return this;
    this.query.include = {
      ...(this.query.include as Record<string, unknown>),
      ...(relation as Record<string, unknown>),
    };
    return this;
  }

  dynamicInclude(
    includeConfig: Record<string, unknown>,
    defaultInclude?: string[],
  ): this {
    if (this.selectFields) return this;

    const result: Record<string, unknown> = {};
    defaultInclude?.forEach((field) => {
      if (includeConfig[field]) result[field] = includeConfig[field];
    });

    const includeParam = this.queryParams.include as string | undefined;
    if (includeParam && typeof includeParam === "string") {
      const requestedRelations = includeParam
        .split(",")
        .map((relation) => relation.trim());
      requestedRelations.forEach((relation) => {
        if (includeConfig[relation]) result[relation] = includeConfig[relation];
      });
    }

    this.query.include = {
      ...(this.query.include as Record<string, unknown>),
      ...result,
    };
    return this;
  }

  where(condition: TWhereInput): this {
    this.query.where = this.deepMerge(
      this.query.where as Record<string, unknown>,
      condition as Record<string, unknown>,
    );
    this.countQuery.where = this.deepMerge(
      this.countQuery.where as Record<string, unknown>,
      condition as Record<string, unknown>,
    );
    return this;
  }

  async execute(): Promise<IQueryResult<T>> {
    const [total, data] = await Promise.all([
      this.model.count(
        this.countQuery as Parameters<typeof this.model.count>[0],
      ),
      this.model.findMany(
        this.query as Parameters<typeof this.model.findMany>[0],
      ),
    ]);

    const totalPages = Math.ceil(total / this.limit);
    return {
      data: data as T[],
      meta: { page: this.page, limit: this.limit, total, totalPages },
    };
  }

  async count(): Promise<number> {
    return await this.model.count(
      this.countQuery as Parameters<typeof this.model.count>[0],
    );
  }

  getQuery(): PrismaFindManyArgs {
    return this.query;
  }

  private deepMerge(
    target: Record<string, unknown>,
    source: Record<string, unknown>,
  ): Record<string, unknown> {
    const result = { ...target };
    for (const key in source) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        if (
          result[key] &&
          typeof result[key] === "object" &&
          !Array.isArray(result[key])
        ) {
          result[key] = this.deepMerge(
            result[key] as Record<string, unknown>,
            source[key] as Record<string, unknown>,
          );
        } else {
          result[key] = source[key];
        }
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  // 👉 FIX 3: Global Parser converts Strings to Booleans, Numbers, AND Dates!
  private parseFilterValue(value: unknown): unknown {
    if (value === "true") return true;
    if (value === "false") return false;

    if (typeof value === "string") {
      // Is it a number?
      if (!isNaN(Number(value)) && value.trim() !== "") return Number(value);

      // Is it a Date String? (YYYY-MM-DD...)
      if (/^\d{4}-\d{2}-\d{2}/.test(value) && !isNaN(Date.parse(value))) {
        return new Date(value);
      }
    }

    if (Array.isArray(value)) {
      return { in: value.map((item) => this.parseFilterValue(item)) };
    }

    return value;
  }

  private parseRangeFilter(
    value: Record<string, unknown>,
  ): Record<string, unknown> {
    const rangeQuery: Record<string, unknown> = {};

    Object.keys(value).forEach((operator) => {
      const operatorValue = value[operator];
      const parsedValue = this.parseFilterValue(operatorValue);

      switch (operator) {
        case "lt":
        case "lte":
        case "gt":
        case "gte":
        case "equals":
        case "not":
        case "contains":
        case "startsWith":
        case "endsWith":
          rangeQuery[operator] = parsedValue;
          break;
        case "in":
        case "notIn":
          if (Array.isArray(operatorValue)) {
            rangeQuery[operator] = operatorValue.map((v) =>
              this.parseFilterValue(v),
            );
          } else {
            rangeQuery[operator] = [parsedValue];
          }
          break;
      }
    });

    return Object.keys(rangeQuery).length > 0 ? rangeQuery : value;
  }
}
