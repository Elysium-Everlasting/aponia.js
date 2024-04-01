<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import { page } from '$app/stores'

  export let data

  $: session = $page.data.session ?? data.session

  async function send() {
    const response = await fetch('/auth/login/credentials', {
      method: 'POST',
      body: JSON.stringify({
        username: 'user',
        password: 'pass',
      }),
    })

    console.log('response: ', response)

    invalidateAll()
  }
</script>

<div>
  {#if session}
    <h1>Logged in as userID: {session.userId}</h1>
  {/if}
  <a href="/auth/login/google">Login with Google</a>
  <a href="/auth/login/github">Login with GitHub</a>
  <form action="/auth/logout" method="post">
    <button type="submit">Logout</button>
  </form>

  <button on:click={send}>Send credentials</button>
</div>
