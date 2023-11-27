<script lang="ts">
  import { page } from '$app/stores'
</script>

<div>
  <div>
    <div style="display: flex; justify-content: center; gap: 16px;">
      <a href="/">HOME</a>
      <a href="/auth/login/google">LOGIN WITH GOOGLE</a>
      <a href="/auth/login/github">LOGIN WITH GITHUB</a>
    </div>

    <div>
      {#if $page.data.session}
        <div>
          <pre>Logged in as {JSON.stringify($page.data.session, undefined, 2)}</pre>
        </div>
        <div style="display: flex; justify-content: center; gap: 16px">
          <form action="/auth/logout" method="POST">
            <button type="submit">LOGOUT</button>
          </form>
        </div>
      {/if}
    </div>
  </div>

  <slot />
</div>
