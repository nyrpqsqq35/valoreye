export const Ports = {
  chatServer: 5223,
  webSocket: 9585,
  webServer: 9586,

  random: () => ((Math.random() * 65530) | 0) + 1,
}
