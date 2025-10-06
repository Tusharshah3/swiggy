import type { NextApiRequest, NextApiResponse } from 'next'

const CATEGORY_LIMITS = {
  biryani: 81,
  burger: 87,
  'butter-chicken': 22,
  dessert: 36,
  dosa: 83,
  idly: 77,
  pasta: 34,
  pizza: 95,
  rice: 35,
  samosa: 22,
}

const ALIAS_MAP: Record<string, keyof typeof CATEGORY_LIMITS> = {
  'ice cream': 'dessert',
  'paneer': 'biryani',
  'sweet': 'dessert',
  'noodle': 'pasta',
  'chocolate': 'dessert',
  'wrap': 'burger',
  'fried rice': 'rice',
  'idli': 'idly',
  'tandoori chicken': 'butter-chicken',
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const rawInput = typeof req.query.name === 'string' ? req.query.name : ''
  const input = rawInput.toLowerCase().trim()
  const tokens = input.split(/\s+/).slice(0, 5)
  const joined = tokens.join(' ')

  console.log('🔍 Raw Input:', rawInput)
  console.log('🧹 Normalized Input:', input)
  console.log('🧩 Tokens:', tokens)
  console.log('🔗 Joined Tokens:', joined)

  if (!input) {
    console.log('❌ No input provided')
    return res.status(400).json({
      error: 'No product name provided in query',
      example: '/api/generate-image?name=butter chicken',
    })
  }

  let matchedFrom = 'Fallback to random category'

  let category: keyof typeof CATEGORY_LIMITS =
    (Object.entries(ALIAS_MAP).find(([alias]) => joined.includes(alias))?.[1] as any) ||
    (tokens.includes('pizza') ? 'pizza' : null) ||
    (tokens.includes('burger') ? 'burger' : null) ||
    (tokens.includes('dosa') ? 'dosa' : null) ||
    (tokens.includes('idly') ? 'idly' : null) ||
    (tokens.includes('biryani') ? 'biryani' : null) ||
    (tokens.includes('pasta') ? 'pasta' : null) ||
    (tokens.includes('rice') ? 'rice' : null) ||
    (tokens.includes('samosa') ? 'samosa' : null) ||
    (tokens.includes('dessert') ? 'dessert' : null) ||
    Object.keys(CATEGORY_LIMITS)[Math.floor(Math.random() * Object.keys(CATEGORY_LIMITS).length)] as keyof typeof CATEGORY_LIMITS

  if (ALIAS_MAP[joined]) {
    matchedFrom = `Alias match for '${joined}'`
    category = ALIAS_MAP[joined]
  } else {
    for (const [alias, mapped] of Object.entries(ALIAS_MAP)) {
      if (joined.includes(alias)) {
        matchedFrom = `Alias match for '${alias}'`
        category = mapped
        break
      }
    }
  }

  console.log('🎯 Matched Category:', category)
  console.log('🧠 Match Reason:', matchedFrom)

  const maxAvailable = CATEGORY_LIMITS[category]
  const imageIndex = Math.floor(Math.random() * maxAvailable) + 1
  const image = `https://foodish-api.com/images/${category}/${category}${imageIndex}.jpg`

  console.log('🖼️ Selected Image:', image)

  res.status(200).json({
    image,
    category,
    matchedFrom,
    input,
    tokens,
    imageIndex,
    maxAvailable,
  })
}
