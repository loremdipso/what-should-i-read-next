let ID = 0;
export interface INotification {
	text: String;
	extra_class?: String;
	id: number;
}

export const notifications: INotification[] = $state([]);

export function notify(text: string, extra_class = "") {
	console.info(text);
	notifications.push({ text, extra_class, id: ++ID });
}

export function remove_notification(notification: INotification) {
	for (let i = 0; i < notifications.length; i++) {
		if (notifications[i] && notifications[i] === notification) {
			notifications.splice(i, 1);
			i -= 1;
		}
	}
}

export let install_prompt: { prompt: any } = $state({ prompt: null });
window.addEventListener("beforeinstallprompt", (event) => {
	event.preventDefault();
	install_prompt.prompt = event;
});
