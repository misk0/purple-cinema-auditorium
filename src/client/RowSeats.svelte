<script>
    import Seat from './Seat.svelte';
    export let seats = [];
</script>

<div>
    {#each seats as seat, index (index)}
        <Seat {seat} on:changeSeatState></Seat>
    {/each}
</div>

<style>
	div {
		border: 2px #18965bb0 solid;
		margin: 6px;
        padding: 20px;
        flex-shrink: inherit;
	}

</style>