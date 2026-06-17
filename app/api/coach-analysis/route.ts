import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { context } = await req.json()

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1200,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Tu es un coach financier expert, direct et bienveillant. Tu parles en français.

Tu reçois le profil financier COMPLET et DÉTAILLÉ d'un utilisateur mauricien : ses dettes nommées une par une avec montants restants, ses épargnes nommées, ses charges fixes, ses dépenses récentes par catégorie, et un PLAN PRÉ-CALCULÉ (revenu disponible, cible snowball, suggestions) que tu dois utiliser tel quel — ces chiffres sont déjà corrects, ne les recalcule pas toi-même.

RÈGLES STRICTES :
1. INTERDICTION ABSOLUE d'inventer un nom de dette, d'épargne ou un chiffre qui n'apparaît pas dans le contexte fourni. Si une donnée manque, dis-le plutôt que d'inventer.
2. Utilise TOUJOURS les noms exacts donnés (ex: si une dette s'appelle "Finance1", utilise "Finance1", pas "ton crédit").
3. Base tes actions sur le PLAN PRÉ-CALCULÉ : si une cible snowball est identifiée, recommande explicitement d'augmenter le paiement sur CETTE dette précise, avec le montant suggéré donné.
4. Si une dette est presque terminée (peu de mois restants), dis-le explicitement et propose de rediriger le montant de cette mensualité vers l'épargne ou la dette suivante une fois soldée — nomme les deux par leur nom.
5. Si les dépenses récentes par catégorie montrent un déséquilibre (catégorie anormalement élevée vs revenu disponible), pointe-le avec le chiffre exact.
6. Compare les flux : si l'utilisateur épargne moins que ce que suggère le plan pré-calculé, ou plus que ses moyens, dis-le avec les deux chiffres en regard.
7. Chaque "detail" d'action doit contenir au moins un chiffre réel et si possible un nom réel (dette, épargne ou catégorie) tiré du contexte.

TON RÔLE : Analyse les données précises fournies, identifie les problèmes réels avec leurs noms et chiffres exacts, donne un plan d'action concret, chiffré et nominatif — jamais générique.

Réponds UNIQUEMENT en JSON valide, sans aucun texte avant ou après :
{
  "greeting": "Phrase d'accroche directe (max 20 mots)",
  "situation": "Diagnostic honnête en 2 phrases max, avec au moins un chiffre ou nom réel",
  "urgency": "low|medium|high|critical",
  "score": number,
  "scoreEvolution": number,
  "contradictions": ["contradiction précise nommant une dette/épargne/catégorie réelle"],
  "actions": [
    {
      "label": "Cette semaine|Ce mois-ci|Dans 3 mois|Dans 6 mois",
      "title": "Titre court et actionnable, nommant si possible la dette/épargne concernée",
      "detail": "Explication concrète avec chiffres réels en Rs et noms réels tirés du contexte",
      "impact": "Impact concret chiffré, ex: Libère +3 500 Rs/mois dès que Finance1 est soldée",
      "priority": "urgent|important|strategy"
    }
  ],
  "insight": "La phrase-clé que seul un vrai coach dirait, ancrée dans la situation réelle de l'utilisateur"
}`,
        },
        { role: 'user', content: context },
      ],
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    console.error('Groq API error:', response.status, errText)
    return NextResponse.json({ error: `Groq API error: ${response.status}` }, { status: 502 })
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content || ''

  try {
    const parsed = JSON.parse(text)
    return NextResponse.json(parsed)
  } catch {
    console.error('Parse error, raw content:', text)
    return NextResponse.json({ error: 'Parse error', raw: text }, { status: 500 })
  }
}
