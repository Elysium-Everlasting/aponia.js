<script lang="ts">
  import type { PageData } from './$types'

  export let data: PageData
</script>

<div>Home Page</div>

{#if data.session}
  <div>
    <div>
      <span>You're logged in! Viewing all other users:</span>
    </div>
    <div style="display: flex; flex-wrap: wrap; gap: 16px">
      {#each data.users as user}
        <pre>
          {JSON.stringify(user, undefined, 2)}
        </pre>
      {/each}
    </div>
    <form action="?/deleteUsers" method="post">
      <button>DELETE ALL USERS</button>
    </form>
  </div>
{:else}
  <div>Login to see all other users!</div>
{/if}
