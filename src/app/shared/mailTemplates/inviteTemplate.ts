export const inviteTemplate = (
  role: string,
  inviteLink: string,
  company: string,
) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>KrewOS Invitation</title>
</head>

<body style="margin:0; padding:0; background:#eef2f7; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:56px 16px;">
<tr>
<td align="center">

<!-- MAIN CONTAINER -->
<table width="100%" cellpadding="0" cellspacing="0" role="presentation"
style="max-width:620px; background:#ffffff; border-radius:10px; overflow:hidden;
box-shadow:0 20px 60px rgba(2,6,23,0.08);">

<!-- HEADER -->
<tr>
<td style="background:linear-gradient(135deg,#0b1020,#111827); padding:40px 42px;">
<table width="100%">
<tr>
<td align="left">
<div style="font-size:22px; font-weight:700; color:#fff;">
krew<span style="color:#60a5fa;">OS</span>
</div>
<div style="font-size:10px; color:#9ca3af; letter-spacing:3px; margin-top:6px;">
CONSTRUCTION INTELLIGENCE
</div>
</td>

<td align="right">
<div style="width:38px;height:38px;border-radius:50%;
background:rgba(255,255,255,0.05);
border:1px solid rgba(255,255,255,0.1);
display:flex;align-items:center;justify-content:center;">
<div style="width:10px;height:10px;background:#3b82f6;border-radius:50%;"></div>
</div>
</td>
</tr>
</table>
</td>
</tr>

<!-- BODY -->
<tr>
<td style="padding:48px 42px 36px;">

<div style="font-size:11px; letter-spacing:3px; color:#94a3b8; text-transform:uppercase;">
Invitation
</div>

<h1 style="margin:14px 0 20px; font-size:28px; line-height:1.35; color:#020617;">
Join <span style="color:#1d4ed8;">${company}</span> on KrewOS
</h1>

<p style="font-size:15px; line-height:1.75; color:#475569; margin:0 0 24px;">
You’ve been granted access to your organization's KrewOS workspace —
a centralized system for operations, reporting, and execution across projects.
</p>

<!-- ROLE CARD -->
<table width="100%" cellpadding="0" cellspacing="0" role="presentation"
style="margin:30px 0;">
<tr>
<td style="border-radius:8px; padding:20px;
background:linear-gradient(135deg,#f8fafc,#f1f5f9);
border:1px solid #e2e8f0;">

<div style="font-size:11px; letter-spacing:2px; color:#64748b; text-transform:uppercase;">
Access Level
</div>

<div style="margin-top:8px; font-size:18px; font-weight:600; color:#1e40af;">
${role}
</div>

</td>
</tr>
</table>

<!-- CTA -->
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:36px 0;">
<tr>
<td align="center">

<a href="${inviteLink}"
style="display:inline-block;
background:linear-gradient(135deg,#2563eb,#1d4ed8);
color:#ffffff;
font-size:13px;
font-weight:600;
text-decoration:none;
padding:16px 52px;
border-radius:8px;
letter-spacing:1.5px;
text-transform:uppercase;
box-shadow:0 10px 25px rgba(37,99,235,0.35);">

Accept Invitation
</a>

<div style="margin-top:14px; font-size:12px; color:#94a3b8;">
Secure link · Expires in 48 hours
</div>

</td>
</tr>
</table>

<!-- DIVIDER -->
<div style="height:1px;background:#e2e8f0;margin:32px 0;"></div>

<!-- SECURITY -->
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="padding:18px;
background:#fff7ed;
border:1px solid #fed7aa;
border-radius:8px;">

<p style="margin:0; font-size:13px; color:#92400e; line-height:1.6;">
<strong>Security notice:</strong> This invitation is private and expires automatically.
Do not share this link with anyone.
</p>

</td>
</tr>
</table>

</td>
</tr>

<!-- FOOTER -->
<tr>
<td style="background:#f8fafc; padding:26px 42px; border-top:1px solid #e2e8f0;">

<table width="100%">
<tr>

<td align="left">
<div style="font-size:11px; color:#64748b;">
© 2026 KrewOS
</div>
<div style="font-size:11px; color:#9ca3af; margin-top:4px;">
Built for modern construction teams
</div>
</td>

<td align="right">
<div style="display:flex; gap:6px;">
<div style="width:6px;height:6px;background:#cbd5e1;border-radius:50%;"></div>
<div style="width:6px;height:6px;background:#93c5fd;border-radius:50%;"></div>
<div style="width:6px;height:6px;background:#2563eb;border-radius:50%;"></div>
</div>
</td>

</tr>
</table>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>`;
};