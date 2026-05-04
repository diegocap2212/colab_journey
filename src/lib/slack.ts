export async function sendSlackNotification(webhookUrl: string, message: object): Promise<boolean> {
  if (!webhookUrl) return false;
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function buildFeedbackNotification(data: {
  engineerName: string;
  evaluatorName: string;
  cycle: string;
  appUrl: string;
}) {
  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📋 Novo Feedback Publicado',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Engenheiro:*\n${data.engineerName}` },
          { type: 'mrkdwn', text: `*Avaliador:*\n${data.evaluatorName}` },
          { type: 'mrkdwn', text: `*Ciclo:*\n${data.cycle}` },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '👁 Ver Feedback' },
            url: `${data.appUrl}/dashboard/feedbacks`,
            style: 'primary',
          },
        ],
      },
    ],
  };
}

export function buildCycleReminderNotification(data: {
  cycleName: string;
  pendingCount: number;
  appUrl: string;
}) {
  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '⏰ Lembrete de Ciclo de Avaliação',
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `O ciclo *${data.cycleName}* está em andamento. *${data.pendingCount} pessoas* ainda não submeteram a autoavaliação.`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '📊 Abrir Matriz' },
            url: `${data.appUrl}/dashboard/matrix`,
            style: 'primary',
          },
        ],
      },
    ],
  };
}
