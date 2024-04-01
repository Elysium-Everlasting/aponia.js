<script lang="ts">
  import  { page } from '$app/stores'

  export let data

  $: session = $page.data.session ?? data.session
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
</div>
