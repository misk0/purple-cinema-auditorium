<script>
    let auditoriumName, theatreName, rows = 1, cols = 1;

    async function submitData(evt) {
        let data = {
            'name': auditoriumName,
            'theatre': theatreName,
            'rows': rows,
            'columns': cols
        }

        const post = await fetch('http://localhost:3333/auditoriums', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
    }
</script>

<div>
    <h1>Create auditorium</h1>
    <label>
        Auditorium name: 
        <input type="text" bind:value={auditoriumName}>
    </label>
    <label>
        Theatre: 
        <input type="text" bind:value={theatreName}>
    </label>
    <label>
        Rows: 
        <input type="number" bind:value={rows} min=1 max=10>
    </label>
    <label>
        Columns: 
        <input type="number" bind:value={cols} min=1 max=15>
    </label>

    <button on:click={submitData}>
        Create
    </button>
</div>

<style>
    div {
        text-align: right;
        width: 700px;
    }
</style>