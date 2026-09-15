/**
 * Premium HTML Email Templates for Bound Marketing
 * Paleta terrosa baseada no Instagram @sejabound:
 * fundo cacau escuro + off-white cremoso + acento caramelo.
 * Inline CSS para universal client support (Gmail, Apple Mail, Outlook).
 */

const BASE_STYLES = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #1A0F08;
  line-height: 1.6;
`;

// Email precisa de fundo escuro para o wordmark "bnd" cacau aparecer bem
// (igual ao Instagram). Mantemos a paleta da marca em modo invertido.
const CONTAINER_STYLE = `
  max-width: 580px;
  margin: 0 auto;
  padding: 32px 24px;
  background-color: #2E1B0F;
  color: #F5F1EA;
  border-radius: 12px;
  border: 1px solid #3D2817;
`;

const HEADER_STYLE = `
  text-align: center;
  padding-bottom: 24px;
  border-bottom: 1px solid #4A3322;
  margin-bottom: 24px;
`;

// Wordmark "bnd" — apenas tipografia, sem moldura
const LOGO_WORDMARK_BOX = `
  display: inline-block;
  color: #F5F1EA;
  font-family: Georgia, 'Times New Roman', serif;
  font-style: italic;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.04em;
  margin-bottom: 12px;
  line-height: 1;
`;

const LOGO_TEXT = `
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.3px;
  color: #F5F1EA;
  text-decoration: none;
  font-family: Georgia, 'Times New Roman', serif;
  font-style: italic;
`;

const BADGE_STYLE = `
  display: inline-block;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
`;

// Botão em gradiente cacau → caramelo (mesma direção do portal)
const BUTTON_STYLE = `
  display: inline-block;
  background: linear-gradient(135deg, #3D2817, #A87653);
  color: #F5F1EA;
  font-weight: 600;
  font-size: 15px;
  padding: 12px 28px;
  border-radius: 8px;
  text-decoration: none;
  margin-top: 24px;
  box-shadow: 0 4px 14px rgba(61, 40, 23, 0.5);
`;

const CARD_BOX = `
  background-color: #3D2817;
  border: 1px solid #4A3322;
  border-radius: 8px;
  padding: 18px;
  margin: 20px 0;
`;

const FOOTER_STYLE = `
  text-align: center;
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid #4A3322;
  font-size: 12px;
  color: #B89E85;
`;

export function renderDeliveryReadyEmail(params: {
  clientName: string;
  taskTitle: string;
  deliveryTitle: string;
  filesCount?: number;
  portalUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Nova Entrega para Aprovação</title></head>
<body style="background-color: #1A0F08; margin: 0; padding: 24px 0; ${BASE_STYLES}">
  <div style="${CONTAINER_STYLE}">
    <div style="${HEADER_STYLE}">
      <div style="${LOGO_TEXT}">Bound <em style="color: #A87653;">Marketing</em></div>
    </div>
    
    <div style="text-align: center;">
      <span style="${BADGE_STYLE} background-color: rgba(168, 118, 83, 0.18); color: #A87653; border: 1px solid rgba(168, 118, 83, 0.35);">
        Nova Entrega
      </span>
      <h1 style="color: #F5F1EA; font-size: 22px; font-weight: 700; margin: 8px 0 16px;">
        Material Pronto para Aprovação
      </h1>
      <p style="color: #D4C9B8; font-size: 15px; margin: 0 0 20px;">
        Olá, <strong>${params.clientName}</strong>! A equipe da Bound Marketing finalizou uma nova entrega para o seu projeto.
      </p>
    </div>

    <div style="${CARD_BOX}">
      <p style="margin: 0 0 8px; font-size: 13px; color: #B89E85; text-transform: uppercase;">Tarefa</p>
      <p style="margin: 0 0 14px; font-size: 16px; font-weight: 600; color: #F5F1EA;">${params.taskTitle}</p>
      
      <p style="margin: 0 0 8px; font-size: 13px; color: #B89E85; text-transform: uppercase;">Entrega</p>
      <p style="margin: 0; font-size: 15px; color: #E8DED0;">${params.deliveryTitle}</p>
      ${params.filesCount ? `<p style="margin: 8px 0 0; font-size: 13px; color: #A87653;">📎 ${params.filesCount} arquivo(s) anexado(s)</p>` : ''}
    </div>

    <div style="text-align: center;">
      <p style="color: #B89E85; font-size: 14px;">Acesse o portal para visualizar as peças e aprovar ou solicitar ajustes.</p>
      <a href="${params.portalUrl}" style="${BUTTON_STYLE}">Visualizar e Aprovar</a>
    </div>

    <div style="${FOOTER_STYLE}">
      <p style="margin: 0 0 4px;">Bound Marketing • Portal do Cliente</p>
      <p style="margin: 0;">Você recebeu esta notificação automática porque faz parte deste projeto.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function renderDeliveryApprovedEmail(params: {
  collaboratorName: string;
  taskTitle: string;
  deliveryTitle: string;
  clientName: string;
  portalUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Entrega Aprovada</title></head>
<body style="background-color: #1A0F08; margin: 0; padding: 24px 0; ${BASE_STYLES}">
  <div style="${CONTAINER_STYLE}">
    <div style="${HEADER_STYLE}">
      <div style="${LOGO_TEXT}">Bound <em style="color: #A87653;">Marketing</em></div>
    </div>
    
    <div style="text-align: center;">
      <span style="${BADGE_STYLE} background-color: rgba(79, 139, 90, 0.18); color: #4F8B5A; border: 1px solid rgba(79, 139, 90, 0.35);">
        ✅ Aprovado
      </span>
      <h1 style="color: #F5F1EA; font-size: 22px; font-weight: 700; margin: 8px 0 16px;">
        Entrega Aprovada pelo Cliente!
      </h1>
      <p style="color: #D4C9B8; font-size: 15px; margin: 0 0 20px;">
        Parabéns, <strong>${params.collaboratorName}</strong>! O cliente <strong>${params.clientName}</strong> aprovou a sua entrega.
      </p>
    </div>

    <div style="${CARD_BOX}">
      <p style="margin: 0 0 8px; font-size: 13px; color: #B89E85; text-transform: uppercase;">Tarefa</p>
      <p style="margin: 0 0 14px; font-size: 16px; font-weight: 600; color: #F5F1EA;">${params.taskTitle}</p>
      
      <p style="margin: 0 0 8px; font-size: 13px; color: #B89E85; text-transform: uppercase;">Entrega</p>
      <p style="margin: 0; font-size: 15px; color: #E8DED0;">${params.deliveryTitle}</p>
    </div>

    <div style="text-align: center;">
      <a href="${params.portalUrl}" style="${BUTTON_STYLE}">Ver no Painel</a>
    </div>

    <div style="${FOOTER_STYLE}">
      <p style="margin: 0 0 4px;">Bound Marketing • Sistema Operacional</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function renderDeliveryRevisionEmail(params: {
  collaboratorName: string;
  taskTitle: string;
  deliveryTitle: string;
  clientName: string;
  feedback: string;
  portalUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Ajustes Solicitados</title></head>
<body style="background-color: #1A0F08; margin: 0; padding: 24px 0; ${BASE_STYLES}">
  <div style="${CONTAINER_STYLE}">
    <div style="${HEADER_STYLE}">
      <div style="${LOGO_TEXT}">Bound <em style="color: #A87653;">Marketing</em></div>
    </div>
    
    <div style="text-align: center;">
      <span style="${BADGE_STYLE} background-color: rgba(214, 145, 56, 0.18); color: #D69138; border: 1px solid rgba(214, 145, 56, 0.35);">
        🔄 Revisão Solicitada
      </span>
      <h1 style="color: #F5F1EA; font-size: 22px; font-weight: 700; margin: 8px 0 16px;">
        Ajustes Solicitados pelo Cliente
      </h1>
      <p style="color: #D4C9B8; font-size: 15px; margin: 0 0 20px;">
        Olá, <strong>${params.collaboratorName}</strong>. O cliente <strong>${params.clientName}</strong> solicitou alterações na entrega.
      </p>
    </div>

    <div style="${CARD_BOX}">
      <p style="margin: 0 0 8px; font-size: 13px; color: #B89E85; text-transform: uppercase;">Tarefa & Entrega</p>
      <p style="margin: 0 0 14px; font-size: 16px; font-weight: 600; color: #F5F1EA;">${params.taskTitle} — ${params.deliveryTitle}</p>
      
      <p style="margin: 0 0 8px; font-size: 13px; color: #D69138; text-transform: uppercase; font-weight: 600;">Feedback do Cliente</p>
      <div style="background-color: rgba(214, 145, 56, 0.12); border-left: 3px solid #D69138; padding: 12px; border-radius: 4px; color: #F5E6D3; font-size: 14px; white-space: pre-wrap;">
${params.feedback}
      </div>
    </div>

    <div style="text-align: center;">
      <a href="${params.portalUrl}" style="${BUTTON_STYLE}">Acessar Tarefa e Ajustar</a>
    </div>

    <div style="${FOOTER_STYLE}">
      <p style="margin: 0 0 4px;">Bound Marketing • Sistema Operacional</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function renderNewBriefingEmail(params: {
  adminOrTeamName: string;
  clientName: string;
  briefingTitle: string;
  category?: string;
  portalUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Novo Briefing Recebido</title></head>
<body style="background-color: #1A0F08; margin: 0; padding: 24px 0; ${BASE_STYLES}">
  <div style="${CONTAINER_STYLE}">
    <div style="${HEADER_STYLE}">
      <div style="${LOGO_TEXT}">Bound <em style="color: #A87653;">Marketing</em></div>
    </div>
    
    <div style="text-align: center;">
      <span style="${BADGE_STYLE} background-color: rgba(168, 118, 83, 0.18); color: #A87653; border: 1px solid rgba(168, 118, 83, 0.35);">
        Novo Pedido
      </span>
      <h1 style="color: #F5F1EA; font-size: 22px; font-weight: 700; margin: 8px 0 16px;">
        Novo Briefing Submetido
      </h1>
      <p style="color: #D4C9B8; font-size: 15px; margin: 0 0 20px;">
        O cliente <strong>${params.clientName}</strong> acaba de registrar uma nova solicitação no portal.
      </p>
    </div>

    <div style="${CARD_BOX}">
      <p style="margin: 0 0 8px; font-size: 13px; color: #B89E85; text-transform: uppercase;">Título do Pedido</p>
      <p style="margin: 0 0 14px; font-size: 16px; font-weight: 600; color: #F5F1EA;">${params.briefingTitle}</p>
      
      ${params.category ? `
        <p style="margin: 0 0 8px; font-size: 13px; color: #B89E85; text-transform: uppercase;">Categoria</p>
        <p style="margin: 0; font-size: 14px; color: #E8DED0;">${params.category}</p>
      ` : ''}
    </div>

    <div style="text-align: center;">
      <a href="${params.portalUrl}" style="${BUTTON_STYLE}">Ver Briefing e Criar Tarefas</a>
    </div>

    <div style="${FOOTER_STYLE}">
      <p style="margin: 0 0 4px;">Bound Marketing • Painel de Gestão</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function renderDnaBriefingEmail(params: {
  problemaReal: string;
  clientesAtuais: string;
  objecaoVenda: string;
  ticketMedio: string;
  metaFaturamento: string;
  concorrentes: string;
  diferencial: string;
  founderStory: string;
  marketingAnterior: string;
  submittedAt: string;
}): string {
  const field = (label: string, value: string) => `
      <p style="margin: 0 0 6px; font-size: 12px; color: #B89E85; text-transform: uppercase; letter-spacing: 0.4px;">${label}</p>
      <div style="margin: 0 0 18px; font-size: 14px; line-height: 1.6; color: #E8DED0; white-space: pre-wrap;">${value}</div>
  `;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Novo Briefing DNA BND</title></head>
<body style="background-color: #1A0F08; margin: 0; padding: 24px 0; ${BASE_STYLES}">
  <div style="${CONTAINER_STYLE}">
    <div style="${HEADER_STYLE}">
      <div style="${LOGO_TEXT}">Bound <em style="color: #A87653;">Marketing</em></div>
    </div>

    <div style="text-align: center;">
      <span style="${BADGE_STYLE} background-color: rgba(168, 118, 83, 0.18); color: #A87653; border: 1px solid rgba(168, 118, 83, 0.35);">
        DNA BND
      </span>
      <h1 style="color: #F5F1EA; font-size: 22px; font-weight: 700; margin: 8px 0 6px;">
        Novo Briefing Recebido
      </h1>
      <p style="color: #D4C9B8; font-size: 13px; margin: 0 0 20px;">
        Enviado em ${new Date(params.submittedAt).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}
      </p>
    </div>

    <div style="${CARD_BOX}">
      ${field('Qual problema real você resolve? Para quem?', params.problemaReal)}
      ${field('Quem compra hoje?', params.clientesAtuais)}
      ${field('Qual é a objeção mais comum na hora da venda?', params.objecaoVenda)}
      ${field('Ticket médio', params.ticketMedio)}
      ${field('Meta de faturamento', params.metaFaturamento)}
      ${field('Principais concorrentes', params.concorrentes)}
      ${field('Diferencial', params.diferencial)}
      ${field('Founder story', params.founderStory)}
      ${field('O que já tentou em marketing e não funcionou', params.marketingAnterior)}
    </div>

    <div style="${FOOTER_STYLE}">
      <p style="margin: 0 0 4px;">Bound Marketing • Briefing DNA BND</p>
      <p style="margin: 0;">Notificação automática — nenhuma resposta é necessária aqui.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function renderCollaboratorInviteEmail(params: {
  collaboratorName: string;
  role: string;
  portalUrl: string;
  tempPassword?: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Convite de Acesso</title></head>
<body style="background-color: #1A0F08; margin: 0; padding: 24px 0; ${BASE_STYLES}">
  <div style="${CONTAINER_STYLE}">
    <div style="${HEADER_STYLE}">
      <div style="${LOGO_TEXT}">Bound <em style="color: #A87653;">Marketing</em></div>
    </div>
    
    <div style="text-align: center;">
      <span style="${BADGE_STYLE} background-color: rgba(168, 118, 83, 0.18); color: #A87653; border: 1px solid rgba(168, 118, 83, 0.35);">
        Acesso Liberado
      </span>
      <h1 style="color: #F5F1EA; font-size: 22px; font-weight: 700; margin: 8px 0 16px;">
        Bem-vindo à equipe Bound!
      </h1>
      <p style="color: #D4C9B8; font-size: 15px; margin: 0 0 20px;">
        Olá, <strong>${params.collaboratorName}</strong>. Você foi cadastrado como <strong>${params.role}</strong> no portal da Bound Marketing.
      </p>
    </div>

    <div style="${CARD_BOX}">
      <p style="margin: 0 0 8px; font-size: 13px; color: #B89E85; text-transform: uppercase;">Como acessar</p>
      <p style="margin: 0 0 10px; font-size: 14px; color: #E8DED0;">Clique no botão abaixo para acessar o portal com seu e-mail.</p>
      ${params.tempPassword ? `
        <p style="margin: 0 0 4px; font-size: 12px; color: #B89E85;">Senha Provisória:</p>
        <code style="background: #1A0F08; padding: 4px 8px; border-radius: 4px; color: #A87653; font-size: 14px;">${params.tempPassword}</code>
      ` : ''}
    </div>

    <div style="text-align: center;">
      <a href="${params.portalUrl}" style="${BUTTON_STYLE}">Acessar o Portal</a>
    </div>

    <div style="${FOOTER_STYLE}">
      <p style="margin: 0 0 4px;">Bound Marketing • Portal da Agência</p>
    </div>
  </div>
</body>
</html>
  `;
}
