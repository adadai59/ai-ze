// 相続税申告：ご相談から申告までの流れ
// サービスページ（inheritance.astro）と、ご依頼の流れページ（flow.astro）の
// 両方から参照する共通データ。内容の二重管理を避けるため、ここに一本化する。
export const inheritanceFlowSteps = [
  {
    step: 1,
    icon: "ph-chats-circle",
    title: "お問い合わせ・ご相談",
    desc: "まずはお気軽にお問い合わせください。初回相談無料です。",
    duration: "即日〜数日",
    prep: "特になし",
  },
  {
    step: 2,
    icon: "ph-clipboard-text",
    title: "ヒアリング・資料確認",
    desc: "ご家族の状況や財産内容を丁寧にヒアリングします。",
    duration: "1〜2週間",
    prep: "通帳のコピー、固定資産税の課税明細書、保険証券など",
  },
  {
    step: 3,
    icon: "ph-chart-line",
    title: "財産評価・税額シミュレーションのご提案",
    desc: "財産を評価し、想定される相続税額をシミュレーションしてご提案します。",
    duration: "2〜3週間",
    prep: "特になし",
  },
  {
    step: 4,
    icon: "ph-signature",
    title: "ご契約",
    desc: "プラン内容にご納得いただけましたら、正式にご契約となります。",
    duration: "即日",
    prep: "認印",
  },
  {
    step: 5,
    icon: "ph-pencil-line",
    title: "相続税申告書の作成",
    desc: "遺産分割の内容を踏まえ、相続税申告書を作成します。",
    duration: "2〜3ヶ月",
    prep: "遺産分割協議書、印鑑証明書",
  },
  {
    step: 6,
    icon: "ph-calendar-check",
    title: "申告・納付",
    desc: "税務署への申告と納付手続きを代行いたします。",
    duration: "1日（期限内）",
    prep: "納税資金のご準備",
  },
];
