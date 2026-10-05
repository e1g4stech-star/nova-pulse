export interface ReminderData {
  userName: string;
  todayEvents: Array<{ title: string; time: string; platform?: string }>;
  tomorrowEvents: Array<{ title: string; time: string; platform?: string }>;
  draftPosts: number;
  affiliateClicks: number;
  affiliateEarnings: number;
}

export function renderReminderEmail(data: ReminderData): string {
  const { userName, todayEvents, tomorrowEvents, draftPosts, affiliateClicks, affiliateEarnings } = data;

  const formatCurrency = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

  const renderEvents = (events: typeof todayEvents, emptyText: string) => {
    if (events.length === 0) {
      return '<p style="color: #94a3b8; font-size: 14px; margin: 8px 0;">' + emptyText + '</p>';
    }
    return events
      .map((e) =>
        '<div style="padding: 12px 16px; background: #1e293b; border-radius: 8px; margin-bottom: 8px; border-left: 3px solid #5ee7ff;">' +
          '<div style="color: #e2e8f0; font-weight: 600; font-size: 14px;">' + e.title + '</div>' +
          '<div style="color: #94a3b8; font-size: 12px; margin-top: 4px;">🕐 ' + e.time + (e.platform ? ' · 📱 ' + e.platform : '') + '</div>' +
        '</div>'
      )
      .join('');
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nova-Pulse Daily Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #0f172a; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155;">
          <tr>
            <td style="padding: 32px 32px 24px; background: linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%);">
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">🚀 Nova-Pulse</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Daily Content Reminder</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 16px;">
              <h2 style="margin: 0; color: #e2e8f0; font-size: 20px;">Halo, ${userName}! 👋</h2>
              <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">Ini ringkasan konten kamu untuk hari ini.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px;">
              <h3 style="margin: 0 0 12px; color: #5ee7ff; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">📅 Hari Ini (${todayEvents.length} konten)</h3>
              ${renderEvents(todayEvents, 'Tidak ada jadwal konten hari ini.')}
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px;">
              <h3 style="margin: 0 0 12px; color: #a855f7; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">🔔 Besok (${tomorrowEvents.length} konten)</h3>
              ${renderEvents(tomorrowEvents, 'Tidak ada jadwal untuk besok.')}
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px 8px;">
              <h3 style="margin: 0 0 12px; color: #e2e8f0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">📊 Stats</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" style="padding: 12px; background: #0f172a; border-radius: 8px; text-align: center;">
                    <div style="color: #94a3b8; font-size: 11px; text-transform: uppercase;">Draft</div>
                    <div style="color: #fbbf24; font-size: 22px; font-weight: 700; margin-top: 4px;">${draftPosts}</div>
                  </td>
                  <td width="8"></td>
                  <td width="33%" style="padding: 12px; background: #0f172a; border-radius: 8px; text-align: center;">
                    <div style="color: #94a3b8; font-size: 11px; text-transform: uppercase;">Clicks</div>
                    <div style="color: #22c55e; font-size: 22px; font-weight: 700; margin-top: 4px;">${affiliateClicks}</div>
                  </td>
                  <td width="8"></td>
                  <td width="33%" style="padding: 12px; background: #0f172a; border-radius: 8px; text-align: center;">
                    <div style="color: #94a3b8; font-size: 11px; text-transform: uppercase;">Earnings</div>
                    <div style="color: #eab308; font-size: 16px; font-weight: 700; margin-top: 4px;">${formatCurrency(affiliateEarnings)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px 32px;" align="center">
              <a href="https://nova-pulse-eta.vercel.app/dashboard" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px;">Buka Dashboard →</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; background: #0f172a; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">Kamu terima email ini karena aktifkan reminder di Nova-Pulse.</p>
              <p style="margin: 8px 0 0; color: #64748b; font-size: 12px;">
                <a href="https://nova-pulse-eta.vercel.app/settings" style="color: #5ee7ff; text-decoration: none;">Kelola preferensi email</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}