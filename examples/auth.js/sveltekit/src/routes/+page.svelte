<script lang="ts">
  export let data
</script>

<div>
  {#if data.session}
    <h1>Logged in as userID: {data.session.userId}</h1>
  {/if}
  <a href="/auth/login/google">Login with Google</a>
  <a href="/auth/login/github">Login with GitHub</a>
  <form action="/auth/logout" method="post">
    <button type="submit">Logout</button>
  </form>
</div>
