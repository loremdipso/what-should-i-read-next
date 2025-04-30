<script lang="ts">
	import Content from "./components/Content.svelte";
	import GithubCorner from "./components/GithubCorner.svelte";
	import Notifications from "./components/Notifications.svelte";

	import { writable } from "svelte/store";
</script>

<GithubCorner />

<Content />

<Notifications />

<style lang="scss">
</style>
