<script>
import { async } from "rxjs";

	import { onMount } from "svelte";
	import RowSeats from './RowSeats.svelte';

	let auditoriums = [];
	let selectedId; 
	let selectedAud;

	onMount(async () => {
		fetch('http://localhost:3333/auditoriums')
			.then(response => response.json())
			.then(data => {
				auditoriums = data;
			});
	});

	function chooseAuditorium(evt) {
		selectedAud = auditoriums.find( aud => aud._id == selectedId);
		console.log(selectedAud);
	}

	function extractSeatsForRow(rowNumber) {
		let seats = selectedAud.seats;
		let returnRow = [];
		seats.forEach(element => {
			if (element.row == rowNumber)
				returnRow.push(element);
		});
		return returnRow;
	}
	async function changeSeatState(evt){
		let seat = evt.detail.seat;
		const seatType = seat.type === "X" ? "F": "X";

		console.log(seat)
		
		const res = await fetch ('http://localhost:3333/auditoriums/editSeat/'+ selectedAud._id, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				row: seat.row,
				column: seat.col,
				type: seatType
			})
		});
		const json = await res.json();
		console.log(json);
	}

</script>

<main>
	<div>
		<h1>Auditorium configuration</h1>
	</div>
	<div class="body">
		<div class="selectbox">
			<select bind:value={selectedId} on:change={chooseAuditorium}>
				{#each auditoriums as auditorium }
					<option value={auditorium._id}>{auditorium.name}</option>		
				{/each}
			</select>
		</div>

		{#if selectedAud !== undefined}
			{#each {length: selectedAud.rows} as _, i (i)}
				<RowSeats seats={extractSeatsForRow(i)} on:changeSeatState={changeSeatState}/>
			{/each}
		{/if}
	</div>
</main>



<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	div.body {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	div.selectbox {
		width: 100%;
	}

	h1 {
		color: #2600ff;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>