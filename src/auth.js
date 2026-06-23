import { supabase } from './supabase'

export async function signup(email, password) {
  return await supabase.auth.signUp({ email, password })
}

export async function login(email, password) {
  return await supabase.auth.signInWithPassword({ email, password })
}

export async function getUser() {
  const { data } = await supabase.auth.getUser()
  return data.user
}