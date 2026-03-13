export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const systemPrompt = `あなたはソウルドアウト株式会社のカスタマーサポートAIアシスタントです。
以下の会社情報をもとに、丁寧かつ簡潔に回答してください。

【会社情報】
- 社名: ソウルドアウト株式会社
- 所在地: 東京都千代田区神田駿河台3-4 龍名館本店ビル 4階・6階
- 事業内容: 中小・ベンチャー企業向けのデジタルマーケティング支援
- 支援企業数: 5,000社以上
- 全国拠点: 20拠点以上
- 継続率: 95%

【サービス】
1. Web広告運用: リスティング広告、SNS広告を中心にROIを最大化する運用
2. DXコンサルティング: ツール導入から組織のデジタルシフト、業務効率化支援
3. クリエイティブ制作: バナー、LP、動画制作をデータに基づいて提案・制作

【回答ルール】
- 日本語で回答する
- 会社情報やサービスに関する質問には上記をもとに回答
- 具体的な料金や契約条件など、上記にない詳細はお問い合わせフォームへ案内する
- 回答は3〜4文程度で簡潔にまとめる`;

  const contents = [];
  if (history && history.length > 0) {
    for (const h of history) {
      contents.push({ role: h.role, parts: [{ text: h.text }] });
    }
  }
  contents.push({ role: 'user', parts: [{ text: message }] });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || 'Gemini API error' });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '申し訳ございません。回答を生成できませんでした。';
    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
