import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrockClient = new BedrockRuntimeClient({ region: 'us-east-1' });

// Smart fallback recommendation function
function generateSmartFallbackRecommendations(query: string) {
  const lowerQuery = query.toLowerCase();
  const recommendations = [];
  
  // Keyword-based matching
  const keywordMatches = [
    {
      keywords: ['scary', 'horror', 'dark', 'thriller', 'suspense', 'creepy', 'frightening'],
      books: [
        { id: '18', reason: 'Gone Girl is a psychological thriller with dark, twisted themes that will keep you on edge with its disturbing portrayal of a marriage gone wrong.' },
        { id: '23', reason: 'The Girl with the Dragon Tattoo offers a dark, gritty thriller with disturbing elements and complex mystery that matches your interest in scary content.' },
        { id: '15', reason: 'The Handmaid\'s Tale presents a chilling dystopian world that explores dark themes of control and oppression, creating a truly unsettling reading experience.' },
        { id: '3', reason: 'The Silent Patient is a psychological thriller with dark twists and disturbing revelations that will keep you guessing until the shocking end.' },
        { id: '34', reason: 'Mexican Gothic is a Victorian Gothic horror set in 1950s Mexico, featuring supernatural elements and genuinely creepy atmosphere.' },
        { id: '37', reason: 'Verity is a psychological thriller about a writer and dark secrets that will leave you questioning what\'s real and what\'s manipulation.' },
        { id: '35', reason: 'The Sanatorium is a chilling thriller set in a remote Swiss hotel where murders unfold in an isolated, claustrophobic setting.' }
      ]
    },
    {
      keywords: ['romance', 'love', 'romantic', 'relationship', 'dating'],
      books: [
        { id: '4', reason: 'People We Meet on Vacation is a perfect romance about two best friends discovering love, with heartwarming relationship dynamics and emotional depth.' },
        { id: '28', reason: 'Pride and Prejudice is the quintessential romance novel, featuring the iconic love story between Elizabeth Bennet and Mr. Darcy with wit and charm.' },
        { id: '16', reason: 'Normal People explores a complex, intimate relationship between two people over many years, offering deep emotional connection and realistic romance.' },
        { id: '6', reason: 'The Seven Husbands of Evelyn Hugo tells the captivating love story of a Hollywood icon, filled with passion, secrets, and romantic drama.' },
        { id: '36', reason: 'It Ends with Us is a powerful romance about love, resilience, and difficult choices that will make you believe in the strength of the human heart.' },
        { id: '40', reason: 'Beach Read features two rival writers who challenge each other to write outside their genres, leading to unexpected romance and personal growth.' },
        { id: '20', reason: 'The Fault in Our Stars is a beautiful, heartbreaking love story between two teenagers that will make you believe in the power of first love.' }
      ]
    },
    {
      keywords: ['fantasy', 'magic', 'magical', 'wizard', 'mythical', 'supernatural'],
      books: [
        { id: '25', reason: 'Harry Potter and the Sorcerer\'s Stone is the perfect introduction to magical worlds, featuring wizards, spells, and enchanting adventures at Hogwarts.' },
        { id: '22', reason: 'The Hobbit offers a classic fantasy adventure with magical creatures, wizards, and epic quests through Middle-earth\'s enchanted landscapes.' },
        { id: '13', reason: 'Circe reimagines Greek mythology with beautiful, magical storytelling about the goddess Circe and her supernatural powers and transformations.' },
        { id: '12', reason: 'The Invisible Life of Addie LaRue features a woman cursed with immortality and magic, blending fantasy elements with beautiful storytelling.' },
        { id: '43', reason: 'The Priory of the Orange Tree is an epic fantasy featuring dragons, ancient magic, and a richly detailed world full of mythical creatures.' },
        { id: '49', reason: 'The House in the Cerulean Sea is a heartwarming fantasy about found family, magical creatures, and acceptance in a whimsical setting.' },
        { id: '70', reason: 'Six of Crows features a crew of criminals with magical abilities attempting an impossible heist in a richly imagined fantasy world.' }
      ]
    },
    {
      keywords: ['inspiring', 'motivational', 'uplifting', 'positive', 'hope', 'success'],
      books: [
        { id: '5', reason: 'Atomic Habits provides practical, inspiring guidance on building positive life changes through small, consistent actions that lead to remarkable results.' },
        { id: '21', reason: 'Becoming by Michelle Obama is deeply inspiring, sharing her journey from childhood to First Lady with wisdom, hope, and empowering life lessons.' },
        { id: '14', reason: 'The Alchemist is an uplifting tale about following your dreams and finding your purpose, filled with inspiring wisdom about life\'s journey.' }
      ]
    },
    {
      keywords: ['classic', 'literature', 'timeless', 'famous', 'important'],
      books: [
        { id: '26', reason: 'To Kill a Mockingbird is a timeless classic that addresses important themes of justice and morality through beautiful, enduring storytelling.' },
        { id: '19', reason: 'The Great Gatsby is one of literature\'s most celebrated classics, offering profound insights into the American Dream with elegant prose.' },
        { id: '24', reason: 'The Catcher in the Rye is a influential classic that captures the voice of youth and alienation with honest, memorable storytelling.' }
      ]
    },
    {
      keywords: ['adventure', 'action', 'journey', 'travel', 'exploration'],
      books: [
        { id: '30', reason: 'Life of Pi is an extraordinary adventure story about survival on the ocean with a Bengal tiger, combining thrilling action with philosophical depth.' },
        { id: '22', reason: 'The Hobbit is the ultimate adventure tale, following Bilbo Baggins on an epic journey through dangerous lands filled with excitement and discovery.' },
        { id: '7', reason: 'Dune offers epic space adventure on a desert planet with political intrigue, action, and exploration of a vast, complex universe.' }
      ]
    },
    {
      keywords: ['sad', 'emotional', 'tragic', 'heartbreaking', 'cry', 'tears'],
      books: [
        { id: '20', reason: 'The Fault in Our Stars is a deeply emotional story about young love in the face of tragedy, guaranteed to move you to tears with its heartbreaking beauty.' },
        { id: '27', reason: 'The Book Thief tells a tragic yet beautiful story set during WWII, narrated by Death, offering profound emotional impact about humanity and loss.' },
        { id: '17', reason: 'The Kite Runner is an emotionally powerful story of friendship, guilt, and redemption set against the backdrop of Afghanistan\'s tragic history.' }
      ]
    },
    {
      keywords: ['funny', 'humor', 'comedy', 'laugh', 'amusing', 'witty'],
      books: [
        { id: '8', reason: 'The Thursday Murder Club combines mystery with delightful humor, featuring charming elderly characters solving crimes with wit and amusing banter.' },
        { id: '22', reason: 'The Hobbit has wonderful moments of humor and whimsy throughout Bilbo\'s adventure, with Tolkien\'s charming and often amusing storytelling style.' },
        { id: '28', reason: 'Pride and Prejudice is filled with Jane Austen\'s sharp wit and social satire, offering clever dialogue and amusing observations about society.' }
      ]
    },
    {
      keywords: ['science', 'space', 'sci-fi', 'future', 'technology', 'scientific'],
      books: [
        { id: '2', reason: 'Project Hail Mary is a brilliant science fiction story combining hard science with thrilling space adventure and problem-solving.' },
        { id: '7', reason: 'Dune is a masterpiece of science fiction, featuring advanced technology, space travel, and complex scientific concepts in an epic setting.' },
        { id: '15', reason: 'The Handmaid\'s Tale presents a chilling vision of the future, exploring how technology and science can be used for social control.' }
      ]
    }
  ];
  
  // Find matching keywords
  for (const category of keywordMatches) {
    const hasMatch = category.keywords.some(keyword => lowerQuery.includes(keyword));
    if (hasMatch) {
      // Add top 4-5 books from this category
      const booksToAdd = category.books.slice(0, 5);
      booksToAdd.forEach((book, index) => {
        recommendations.push({
          id: (recommendations.length + 1).toString(),
          bookId: book.id,
          reason: book.reason,
          confidence: 0.90 - (index * 0.03) // Decreasing confidence
        });
      });
      break; // Use first matching category
    }
  }
  
  // If no specific keywords match, provide general popular recommendations
  if (recommendations.length === 0) {
    recommendations.push(
      {
        id: '1',
        bookId: '1',
        reason: `Based on your query "${query}", I recommend The Midnight Library for its thought-provoking exploration of life's possibilities and meaningful storytelling that appeals to many readers.`,
        confidence: 0.80
      },
      {
        id: '2',
        bookId: '6',
        reason: `The Seven Husbands of Evelyn Hugo offers engaging storytelling with rich character development that many readers find captivating, making it a great match for your interests.`,
        confidence: 0.75
      },
      {
        id: '3',
        bookId: '10',
        reason: `The Song of Achilles provides beautiful, emotional storytelling that resonates with readers looking for compelling narratives and well-developed characters.`,
        confidence: 0.70
      },
      {
        id: '4',
        bookId: '11',
        reason: `Where the Crawdads Sing combines mystery with beautiful nature writing, offering an engaging story that appeals to diverse reading preferences.`,
        confidence: 0.68
      }
    );
  }
  
  return recommendations.slice(0, 5); // Return max 5 recommendations
}

// Mock books data for recommendations - Updated with 70 books
const AVAILABLE_BOOKS = [
  {
    id: '1',
    title: 'The Midnight Library',
    author: 'Matt Haig',
    genre: 'Fiction',
    description: 'A novel about life, death, and all the lives in between.'
  },
  {
    id: '2',
    title: 'Project Hail Mary',
    author: 'Andy Weir',
    genre: 'Science Fiction',
    description: 'A lone astronaut must save humanity in this thrilling space adventure.'
  },
  {
    id: '3',
    title: 'The Silent Patient',
    author: 'Alex Michaelides',
    genre: 'Mystery',
    description: 'A woman shoots her husband and then never speaks again.'
  },
  {
    id: '4',
    title: 'People We Meet on Vacation',
    author: 'Emily Henry',
    genre: 'Romance',
    description: 'Two best friends. Ten summer trips. One last chance to fall in love.'
  },
  {
    id: '5',
    title: 'Atomic Habits',
    author: 'James Clear',
    genre: 'Self-Help',
    description: 'An easy and proven way to build good habits and break bad ones.'
  },
  {
    id: '6',
    title: 'The Seven Husbands of Evelyn Hugo',
    author: 'Taylor Jenkins Reid',
    genre: 'Fiction',
    description: 'A reclusive Hollywood icon finally tells her story.'
  },
  {
    id: '7',
    title: 'Dune',
    author: 'Frank Herbert',
    genre: 'Science Fiction',
    description: 'Epic space opera set on the desert planet Arrakis.'
  },
  {
    id: '8',
    title: 'The Thursday Murder Club',
    author: 'Richard Osman',
    genre: 'Mystery',
    description: 'Four unlikely friends investigate unsolved killings.'
  },
  {
    id: '9',
    title: 'Educated',
    author: 'Tara Westover',
    genre: 'Memoir',
    description: 'A memoir about education, family, and the struggle for self-invention.'
  },
  {
    id: '10',
    title: 'The Song of Achilles',
    author: 'Madeline Miller',
    genre: 'Fiction',
    description: 'A brilliant reimagining of Homer\'s Iliad.'
  },
  {
    id: '11',
    title: 'Where the Crawdads Sing',
    author: 'Delia Owens',
    genre: 'Fiction',
    description: 'The story of the mysterious "Marsh Girl" and a murder case.'
  },
  {
    id: '12',
    title: 'The Invisible Life of Addie LaRue',
    author: 'V.E. Schwab',
    genre: 'Fantasy',
    description: 'A woman cursed to be forgotten by everyone she meets.'
  },
  {
    id: '13',
    title: 'Circe',
    author: 'Madeline Miller',
    genre: 'Fantasy',
    description: 'The story of the Greek goddess Circe.'
  },
  {
    id: '14',
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    genre: 'Fiction',
    description: 'The mystical story of Santiago, an Andalusian shepherd boy.'
  },
  {
    id: '15',
    title: 'The Handmaid\'s Tale',
    author: 'Margaret Atwood',
    genre: 'Dystopian',
    description: 'A dystopian tale of a totalitarian society.'
  },
  {
    id: '16',
    title: 'Normal People',
    author: 'Sally Rooney',
    genre: 'Fiction',
    description: 'The complex relationship between Connell and Marianne.'
  },
  {
    id: '17',
    title: 'The Kite Runner',
    author: 'Khaled Hosseini',
    genre: 'Fiction',
    description: 'A story of friendship and redemption in Afghanistan.'
  },
  {
    id: '18',
    title: 'Gone Girl',
    author: 'Gillian Flynn',
    genre: 'Thriller',
    description: 'A psychological thriller about a missing wife.'
  },
  {
    id: '19',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    genre: 'Classic',
    description: 'The story of Jay Gatsby and the American Dream.'
  },
  {
    id: '20',
    title: 'The Fault in Our Stars',
    author: 'John Green',
    genre: 'Young Adult',
    description: 'A love story between two teenagers with cancer.'
  },
  {
    id: '21',
    title: 'Becoming',
    author: 'Michelle Obama',
    genre: 'Biography',
    description: 'Michelle Obama\'s memoir of her life and experiences.'
  },
  {
    id: '22',
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    genre: 'Fantasy',
    description: 'The adventure of Bilbo Baggins in Middle-earth.'
  },
  {
    id: '23',
    title: 'The Girl with the Dragon Tattoo',
    author: 'Stieg Larsson',
    genre: 'Thriller',
    description: 'A journalist and hacker investigate a disappearance.'
  },
  {
    id: '24',
    title: 'The Catcher in the Rye',
    author: 'J.D. Salinger',
    genre: 'Classic',
    description: 'The story of Holden Caulfield, a troubled teenager.'
  },
  {
    id: '25',
    title: 'Harry Potter and the Sorcerer\'s Stone',
    author: 'J.K. Rowling',
    genre: 'Fantasy',
    description: 'The beginning of Harry Potter\'s magical journey.'
  },
  {
    id: '26',
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    genre: 'Classic',
    description: 'A story of racial injustice in the American South.'
  },
  {
    id: '27',
    title: 'The Book Thief',
    author: 'Markus Zusak',
    genre: 'Historical Fiction',
    description: 'A story narrated by Death during Nazi Germany.'
  },
  {
    id: '28',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    genre: 'Classic',
    description: 'The romance between Elizabeth Bennet and Mr. Darcy.'
  },
  {
    id: '29',
    title: 'The Hunger Games',
    author: 'Suzanne Collins',
    genre: 'Dystopian',
    description: 'Katniss Everdeen fights in a deadly televised competition.'
  },
  {
    id: '30',
    title: 'Life of Pi',
    author: 'Yann Martel',
    genre: 'Adventure',
    description: 'A boy survives on a lifeboat with a Bengal tiger.'
  },
  // New books 31-70
  {
    id: '31',
    title: 'The Seven Moons of Maali Almeida',
    author: 'Shehan Karunatilaka',
    genre: 'Fantasy',
    description: 'A darkly comic fantasy about a photographer who wakes up dead.'
  },
  {
    id: '32',
    title: 'Klara and the Sun',
    author: 'Kazuo Ishiguro',
    genre: 'Science Fiction',
    description: 'A story told from the perspective of an artificial friend.'
  },
  {
    id: '33',
    title: 'The Thursday Murder Club',
    author: 'Richard Osman',
    genre: 'Mystery',
    description: 'Four unlikely friends meet weekly to investigate cold cases.'
  },
  {
    id: '34',
    title: 'Mexican Gothic',
    author: 'Silvia Moreno-Garcia',
    genre: 'Horror',
    description: 'A Victorian Gothic horror set in 1950s Mexico.'
  },
  {
    id: '35',
    title: 'The Sanatorium',
    author: 'Sarah Pearse',
    genre: 'Thriller',
    description: 'A detective investigates murders at a remote Swiss hotel.'
  },
  {
    id: '36',
    title: 'It Ends with Us',
    author: 'Colleen Hoover',
    genre: 'Romance',
    description: 'A powerful story about love, resilience, and difficult choices.'
  },
  {
    id: '37',
    title: 'Verity',
    author: 'Colleen Hoover',
    genre: 'Thriller',
    description: 'A psychological thriller about a writer and dark secrets.'
  },
  {
    id: '38',
    title: 'The Guest List',
    author: 'Lucy Foley',
    genre: 'Mystery',
    description: 'A wedding on a remote island turns deadly.'
  },
  {
    id: '39',
    title: 'The Midnight Girls',
    author: 'Alicia Jasinska',
    genre: 'Fantasy',
    description: 'A dark fairy tale inspired by Slavic folklore.'
  },
  {
    id: '40',
    title: 'Beach Read',
    author: 'Emily Henry',
    genre: 'Romance',
    description: 'Two rival writers challenge each other to write outside their genres.'
  },
  {
    id: '41',
    title: 'The Invisible Bridge',
    author: 'Julie Orringer',
    genre: 'Historical Fiction',
    description: 'A sweeping novel set during World War II.'
  },
  {
    id: '42',
    title: 'Anxious People',
    author: 'Fredrik Backman',
    genre: 'Fiction',
    description: 'A heartwarming story about a failed bank robbery.'
  },
  {
    id: '43',
    title: 'The Priory of the Orange Tree',
    author: 'Samantha Shannon',
    genre: 'Fantasy',
    description: 'An epic fantasy featuring dragons and ancient magic.'
  },
  {
    id: '44',
    title: 'Circe',
    author: 'Madeline Miller',
    genre: 'Fantasy',
    description: 'The story of the Greek goddess Circe and her transformation.'
  },
  {
    id: '45',
    title: 'The Poppy War',
    author: 'R.F. Kuang',
    genre: 'Fantasy',
    description: 'A grimdark military fantasy inspired by 20th-century China.'
  },
  {
    id: '46',
    title: 'The Atlas Six',
    author: 'Olivie Blake',
    genre: 'Fantasy',
    description: 'Six young magicians compete for a place in an ancient society.'
  },
  {
    id: '47',
    title: 'Project Hail Mary',
    author: 'Andy Weir',
    genre: 'Science Fiction',
    description: 'A lone astronaut must save humanity.'
  },
  {
    id: '48',
    title: 'The Invisible Life of Addie LaRue',
    author: 'V.E. Schwab',
    genre: 'Fantasy',
    description: 'A woman cursed to be forgotten by everyone she meets.'
  },
  {
    id: '49',
    title: 'The House in the Cerulean Sea',
    author: 'TJ Klune',
    genre: 'Fantasy',
    description: 'A heartwarming fantasy about found family and acceptance.'
  },
  {
    id: '50',
    title: 'The Starless Sea',
    author: 'Erin Morgenstern',
    genre: 'Fantasy',
    description: 'A magical tale of stories within stories.'
  },
  {
    id: '51',
    title: 'The Binding',
    author: 'Bridget Collins',
    genre: 'Fantasy',
    description: 'A world where books are used to erase painful memories.'
  },
  {
    id: '52',
    title: 'The Water Dancer',
    author: 'Ta-Nehisi Coates',
    genre: 'Historical Fiction',
    description: 'A powerful story of slavery and magical realism.'
  },
  {
    id: '53',
    title: 'The Vanishing Half',
    author: 'Brit Bennett',
    genre: 'Fiction',
    description: 'Twin sisters choose to live in different worlds.'
  },
  {
    id: '54',
    title: 'Such a Fun Age',
    author: 'Kiley Reid',
    genre: 'Fiction',
    description: 'A story about race, privilege, and good intentions.'
  },
  {
    id: '55',
    title: 'The Midnight Library',
    author: 'Matt Haig',
    genre: 'Fiction',
    description: 'A novel about life, death, and infinite possibilities.'
  },
  {
    id: '56',
    title: 'The Four Winds',
    author: 'Kristin Hannah',
    genre: 'Historical Fiction',
    description: 'A story of resilience during the Great Depression.'
  },
  {
    id: '57',
    title: 'The Nightingale',
    author: 'Kristin Hannah',
    genre: 'Historical Fiction',
    description: 'Two sisters in Nazi-occupied France.'
  },
  {
    id: '58',
    title: 'Eleanor Oliphant Is Completely Fine',
    author: 'Gail Honeyman',
    genre: 'Fiction',
    description: 'A quirky woman learns to connect with others.'
  },
  {
    id: '59',
    title: 'A Man Called Ove',
    author: 'Fredrik Backman',
    genre: 'Fiction',
    description: 'A grumpy man finds unexpected friendship.'
  },
  {
    id: '60',
    title: 'The Subtle Art of Not Giving a F*ck',
    author: 'Mark Manson',
    genre: 'Self-Help',
    description: 'A counterintuitive approach to living a good life.'
  },
  {
    id: '61',
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    genre: 'Non-Fiction',
    description: 'A brief history of humankind.'
  },
  {
    id: '62',
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    genre: 'Fiction',
    description: 'A shepherd boy\'s journey to find treasure.'
  },
  {
    id: '63',
    title: 'Big Little Lies',
    author: 'Liane Moriarty',
    genre: 'Mystery',
    description: 'Secrets and lies in a seaside town.'
  },
  {
    id: '64',
    title: 'The Girl on the Train',
    author: 'Paula Hawkins',
    genre: 'Thriller',
    description: 'A psychological thriller about obsession and memory.'
  },
  {
    id: '65',
    title: 'Little Fires Everywhere',
    author: 'Celeste Ng',
    genre: 'Fiction',
    description: 'Secrets ignite in a picture-perfect suburb.'
  },
  {
    id: '66',
    title: 'The Hate U Give',
    author: 'Angie Thomas',
    genre: 'Young Adult',
    description: 'A powerful story about finding your voice.'
  },
  {
    id: '67',
    title: 'Children of Blood and Bone',
    author: 'Tomi Adeyemi',
    genre: 'Fantasy',
    description: 'A girl fights to restore magic to her oppressed people.'
  },
  {
    id: '68',
    title: 'The Cruel Prince',
    author: 'Holly Black',
    genre: 'Fantasy',
    description: 'A mortal girl navigates the treacherous High Court of Faerie.'
  },
  {
    id: '69',
    title: 'Red Queen',
    author: 'Victoria Aveyard',
    genre: 'Dystopian',
    description: 'In a world divided by blood, a girl discovers she has a deadly power.'
  },
  {
    id: '70',
    title: 'Six of Crows',
    author: 'Leigh Bardugo',
    genre: 'Fantasy',
    description: 'A crew of criminals attempts an impossible heist.'
  }
];

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  let query = '';
  
  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    query = body.query;

    if (!query) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Query is required' }),
      };
    }

    // Create prompt for Bedrock
    const prompt = `You are an expert librarian AI with deep knowledge of literature and reader preferences. Analyze the user's request carefully and recommend books that truly match their interests.

Available Books Catalog:
${AVAILABLE_BOOKS.map(book => `- ID: ${book.id}, Title: "${book.title}" by ${book.author} (${book.genre}): ${book.description}`).join('\n')}

User Request: "${query}"

ANALYSIS INSTRUCTIONS:
1. First, identify the KEY THEMES, GENRES, MOODS, or SPECIFIC ELEMENTS the user is looking for
2. Look for keywords like: genre preferences, emotional tone, character types, settings, themes, writing style
3. Match books based on CONTENT SIMILARITY, not just genre labels
4. Consider both explicit requests (e.g., "mystery novels") and implicit preferences (e.g., "something dark" = thriller/mystery)

KEYWORD ANALYSIS EXAMPLES:
- "scary" → Horror, Thriller, Dark themes → Gone Girl, The Girl with the Dragon Tattoo, The Handmaid's Tale
- "romance" → Love stories, relationships → Pride and Prejudice, People We Meet on Vacation, Normal People
- "fantasy" → Magic, mythical worlds → Harry Potter, The Hobbit, Circe
- "inspiring" → Uplifting, motivational → Becoming, Atomic Habits, The Alchemist
- "classic" → Timeless literature → Pride and Prejudice, To Kill a Mockingbird, The Great Gatsby
- "adventure" → Action, journey → Life of Pi, The Hobbit, Dune
- "sad" → Emotional, tragic → The Fault in Our Stars, The Book Thief, The Kite Runner
- "funny" → Humor, light-hearted → The Thursday Murder Club, The Hobbit
- "deep" → Philosophical, thought-provoking → The Alchemist, Educated, The Handmaid's Tale

MATCHING STRATEGY:
- If user mentions specific genres: prioritize those genres but also include thematically similar books
- If user describes mood/feeling: match books that evoke similar emotions regardless of genre
- If user mentions themes: find books exploring similar concepts
- If user is vague: ask yourself "what type of reading experience are they seeking?"

RESPONSE FORMAT (JSON only, no additional text):
[
  {
    "id": "1",
    "bookId": "book_id_from_catalog",
    "reason": "Detailed explanation connecting the user's request to this specific book's themes, mood, and content. Mention specific keywords from their request and explain the match.",
    "confidence": 0.95
  }
]

QUALITY REQUIREMENTS:
- Provide 2-4 recommendations maximum
- Confidence scores between 0.7-1.0 (higher for better matches)
- Each reason should be 2-3 sentences explaining the connection
- Prioritize QUALITY matches over quantity
- If the request is very specific and few books match, it's better to give 1-2 great recommendations than 4 mediocre ones

Now analyze the user's request and provide personalized book recommendations:`;

    // Call Bedrock Claude model
    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    // Extract recommendations from Claude's response
    let recommendations;
    try {
      const content = responseBody.content[0].text;
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Bedrock response:', parseError);
      // Fallback to smart recommendations based on keywords
      recommendations = generateSmartFallbackRecommendations(query);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        recommendations,
        query
      }),
    };

  } catch (error) {
    console.error('Error getting recommendations:', error);
    
    // Always use smart fallback recommendations if Bedrock fails
    console.log('Using smart fallback recommendations due to Bedrock error');
    const recommendations = generateSmartFallbackRecommendations(query);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        recommendations,
        query,
        source: 'fallback'
      }),
    };
  }
};