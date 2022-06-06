<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    export let seat;
    let seatColor = seat.type === "X" ? "gray" : "green" 

    function changeSeatState() {
        dispatch('changeSeatState', {seat});
        if (seat.type === "X") {
            seatColor = "green";
            seat.type = "F";
        } else {
            seatColor = "gray";
            seat.type = "X";
        }
    }
</script>

<div on:click={changeSeatState} class="{seatColor}">
    {seat.type}
</div>

<style>
    div {
        display: inline-block;
        min-width: 24px;
        padding: 4px;
        border: 1px solid blue;
        cursor: pointer;
        margin-left: 5px;
        margin-right: 5px;
        border-bottom-left-radius: 6px;
        border-bottom-right-radius: 6px;
    }
    .gray {
        background-color: gray;
        color: white;
    }
    .green {
        background-color: greenyellow;
    }
</style>