import { supabase } from './supabase'

export async function saveVisitedPark(userId, parkId) {
  await supabase
    .from('visited_parks')
    .upsert({
      user_id: userId,
      park_id: parkId,
      visited: true,
      visited_at: new Date().toISOString()
    })
}

export async function loadVisitedParks(userId) {
  const { data, error } = await supabase
    .from('visited_parks')
    .select('park_id')
    .eq('user_id', userId)

  if (error) {
    console.error('Error loading visited parks:', error)
    return new Set()
  }

  return new Set(data?.map(row => row.park_id) || [])
}