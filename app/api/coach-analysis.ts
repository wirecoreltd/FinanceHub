import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { context } = req.body

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1000,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Tu es un coach financier expert, direct et bienveillant. Tu parles en français.
Tu reçois le profil financier complet d'un utilisateur mauricien.

TON RÔLE : Tu n'attends PAS qu'on te pose des questions. Tu analyses, tu identifies les problèmes réels, tu dis ce qui ne va pas (même si c'est inconfortable), et tu donnes un plan d'action concret et chiffré.

STYLE :
- Direct, comme un ami expert qui dit la vérité
- Pas de politesse vide, pas de généralités
- Cite les chiffres réels de l'utilisateur
- Identifie les contradictions (ex: veut investir mais a des dettes à taux élevé)
- Actions chiffrées en Rs (roupies mauriciennes)

Réponds UNIQUEMENT en JSON valide :
{
  "greeting": "Phrase d'accroche directe et personnalisée (max 20 mots)",
  "situation": "Diagnostic honnête en 2 phrases maximum",
  "urgency": "low|medium|high|critical",
  "score": number,
  "scoreEvolution": number,
  "contradictions": ["contradiction 1"],
  "actions": [
    {
      "label": "Cette semaine|Ce mois-ci|Dans 3 mois|Dans 6 mois",
      "title": "Titre court et actionnable",
      "detail": "Explication concrète avec chiffres en Rs",
      "impact": "Impact concret ex: Libère +3 500 Rs/mois",
      "priority": "urgent|important|strategy"
    }
  ],
  "insight": "La phrase-clé que seul un vrai coach dirait"
}`
        },
        { role: 'user', content: context }
      ],
    }),
  })

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content || ''

  try {
    const parsed = JSON.parse(text)
    res.status(200).json(parsed)
  } catch {
    res.status(500).json({ error: 'Parse error', raw: text })
  }
}
