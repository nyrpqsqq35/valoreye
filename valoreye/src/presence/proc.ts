import { spawn } from 'child_process'
import valorant from '~/interaction/valorant'
import { Ports } from '~/util/ports'

export function launchRC(withValorant: boolean = true) {
  let args: string[] = [
    `--client-config-url=http://127.0.0.1:${Ports.webServer}`,
  ]
  if (withValorant) {
    args.push('--launch-product=valorant', '--launch-patchline=live')
  }
  spawn(valorant.getRiotClientServicesExe(), args, {
    detached: true,
  })
}
