import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import type { Database } from '../../types/supabase'

console.log("Hello from invite user function!")

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        },
      )
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Look for existing user by email in auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      throw new Error(`Failed to search users: ${authError.message}`)
    }

    const existingAuthUser = authUsers.users.find(user => user.email === email)
    
    if (existingAuthUser) {
      // User exists, get their profile from users table
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('user_id', existingAuthUser.id)
        .single()

      if (userError) {
        throw new Error(`Failed to get user profile: ${userError.message}`)
      }

      return new Response(
        JSON.stringify({
          success: true,
          user: userData,
          isNewUser: false
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    } else {
      // User doesn't exist, send invitation email
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)
      
      if (inviteError) {
        throw new Error(`Failed to send invitation: ${inviteError.message}`)
      }

      // Create user profile in users table
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          user_id: inviteData.user.id,
          name: email.split('@')[0], // Use email prefix as default name
        })
        .select()
        .single()

      if (createError) {
        throw new Error(`Failed to create user profile: ${createError.message}`)
      }

      return new Response(
        JSON.stringify({
          success: true,
          user: newUser,
          isNewUser: true,
          invitationSent: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }
  } catch (error) {
    console.error('Error in invite-user function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      },
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/invite-user' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"email":"test@example.com"}'

*/
