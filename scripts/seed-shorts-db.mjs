import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = fs.readFileSync('.env.local', 'utf8')
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim()
const serviceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim()

const supabase = createClient(url, serviceKey)

const DEMO_SHORTS = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    title: '⚡ Java Heap vs Stack Memory in 45 Seconds!',
    description: 'Understand how references live on the Stack while dynamic objects reside in Heap memory. Essential for Java & backend interviews!',
    video_url: '/videos/sample-short-1.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
    duration: 45,
    teacher_id: '00000000-0000-0000-0000-000000000002',
    course_id: '11111111-1111-1111-1111-111111111111',
    course_title: 'Java Programming Complete Masterclass',
    views_count: 14200,
    likes_count: 852,
    tags: ['Java', 'Programming', 'Memory', 'Interview'],
    is_published: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString()
  },
  {
    id: 'a2222222-2222-2222-2222-222222222222',
    title: '🧲 Right-Hand Thumb Rule & Magnetic Field Lines Visualized',
    description: 'Point your thumb along the current vector, curl your fingers — see the concentric magnetic flux lines generated in 3D!',
    video_url: '/videos/sample-short-2.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=600&auto=format&fit=crop&q=80',
    duration: 52,
    teacher_id: '00000000-0000-0000-0000-000000000002',
    course_id: null,
    course_title: 'Class 12 Advanced Physics',
    views_count: 9840,
    likes_count: 614,
    tags: ['Physics', 'Electromagnetism', 'Class12', 'Science'],
    is_published: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString()
  },
  {
    id: 'a3333333-3333-3333-3333-333333333333',
    title: '🧪 SN2 Inversion (Walden Inversion) Explained in 40s!',
    description: 'Backside attack by the nucleophile flips the tetrahedral carbon like an umbrella in a storm! One-step bimolecular kinetics.',
    video_url: '/videos/sample-short-3.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&auto=format&fit=crop&q=80',
    duration: 38,
    teacher_id: '00000000-0000-0000-0000-000000000002',
    course_id: null,
    course_title: 'Organic Chemistry for NEET & JEE',
    views_count: 18500,
    likes_count: 1240,
    tags: ['Chemistry', 'OrganicChemistry', 'NEET', 'JEE'],
    is_published: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
  },
  {
    id: 'a4444444-4444-4444-4444-444444444444',
    title: '🚀 Next.js 16 Server Actions Demystified in 50 Seconds',
    description: 'No API routes needed! Mark an async function with use server and mutate data straight from your form or client components.',
    video_url: '/videos/sample-short-4.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
    duration: 49,
    teacher_id: '00000000-0000-0000-0000-000000000002',
    course_id: null,
    course_title: 'Fullstack Next.js 16 & Supabase Masterclass',
    views_count: 22100,
    likes_count: 1890,
    tags: ['Nextjs', 'React', 'WebDev', 'Fullstack'],
    is_published: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString()
  },
  {
    id: 'a5555555-5555-5555-5555-555555555555',
    title: "⚡ Lenz's Law: Why Induced Current Opposes the Change",
    description: 'Nature loves conservation of energy! Drop a magnet down a copper tube and watch eddy currents slow it down in real-time.',
    video_url: '/videos/sample-short-2.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=600&auto=format&fit=crop&q=80',
    duration: 42,
    teacher_id: '00000000-0000-0000-0000-000000000002',
    course_id: null,
    course_title: 'Class 12 Advanced Physics',
    views_count: 8100,
    likes_count: 540,
    tags: ['Physics', 'Electromagnetism', 'Experiments', 'Science'],
    is_published: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
  },
  {
    id: 'a6666666-6666-6666-6666-666666666666',
    title: '💡 3 VS Code Shortcuts Every Developer Must Use Daily',
    description: 'Multi-cursor editing, quick symbol search, and smart bracket matching. Boost your coding speed 2x today!',
    video_url: '/videos/sample-short-1.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&auto=format&fit=crop&q=80',
    duration: 35,
    teacher_id: '00000000-0000-0000-0000-000000000002',
    course_id: '11111111-1111-1111-1111-111111111111',
    course_title: 'Java Programming Complete Masterclass',
    views_count: 15700,
    likes_count: 1040,
    tags: ['Productivity', 'VSCode', 'CodingTips', 'DevTips'],
    is_published: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
  },
  {
    id: 'a7777777-7777-7777-7777-777777777777',
    title: '⏱️ Big-O Notation: O(1) vs O(N) vs O(N²) Explained Quickly',
    description: 'Why does your nested loop freeze the browser? Learn time complexity and algorithm scaling in less than a minute!',
    video_url: '/videos/sample-short-1.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=600&auto=format&fit=crop&q=80',
    duration: 58,
    teacher_id: '00000000-0000-0000-0000-000000000002',
    course_id: '11111111-1111-1111-1111-111111111111',
    course_title: 'Java Programming Complete Masterclass',
    views_count: 31200,
    likes_count: 2430,
    tags: ['Algorithms', 'DataStructures', 'Programming', 'Interview'],
    is_published: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString()
  },
  {
    id: 'a8888888-8888-8888-8888-888888888888',
    title: '🌐 CSS Flexbox vs CSS Grid — When to Use Which?',
    description: '1D alignment vs 2D structural layouts! Stop guessing and pick the right CSS layout tool every single time.',
    video_url: '/videos/sample-short-2.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&auto=format&fit=crop&q=80',
    duration: 47,
    teacher_id: '00000000-0000-0000-0000-000000000002',
    course_id: null,
    course_title: 'Fullstack Web Development Bootcamp',
    views_count: 19800,
    likes_count: 1560,
    tags: ['CSS', 'WebDev', 'Frontend', 'Design'],
    is_published: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()
  }
]

async function seedShorts() {
  console.log('Seeding demo data into shorts table...')
  for (const item of DEMO_SHORTS) {
    const { data, error } = await supabase.from('shorts').upsert(item).select('id, title')
    if (error) {
      console.error(`Failed to insert "${item.title}":`, error.message)
    } else {
      console.log(`✓ Inserted/Updated: "${item.title}" (${item.id})`)
    }
  }

  const { count, error } = await supabase.from('shorts').select('*', { count: 'exact', head: true })
  console.log(`\n🎉 Total shorts in database: ${count}`)
}

seedShorts()
