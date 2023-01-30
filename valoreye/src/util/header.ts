import chalk from 'chalk'
import valorant from '~/interaction/valorant'
import { Ports } from './ports'

const ENDL_REGEX = /\r?\n/gi

function ep(str, len = process.stdout.columns) {
  let maxLen = Math.max(...str.split(ENDL_REGEX).map((i) => i.length), len)
  return str
    .split(ENDL_REGEX)
    .map((i) => {
      return i + ' '.repeat(maxLen - i.length)
    })
    .join('\n')
}

function xc(str) {
  let maxLen = Math.max(...str.split(ENDL_REGEX).map((i) => i.length))
  let padLeft = Math.floor((process.stdout.columns - maxLen) / 2)
  return ep(
    str
      .split(ENDL_REGEX)
      .map((i) => ' '.repeat(padLeft) + i)
      .join('\n')
  )
}

export function printHeader() {
  const hdr = chalk.bgBlue('='.repeat(process.stdout.columns))
  const versionString = chalk.bgBlue(
    xc(`${BUILD_META.version}+${BUILD_META.commit}`)
  )
  if (process.stdout.columns >= 120) {
    console.log(
      chalk.bgBlue(
        xc(`
                                    .-'''-.                                 ██████████████████████████
                           .---.   '   _    \\                           ██████████████████████      ██████
   .----.     .----.       |   | /   /\` '.   \\                ██      ████  ██████████████    ██      ██████
    \\    \\   /    /        |   |.   |     \\  '                ░░▒▒▒▒▒▒██░░▒▒██████████████    ░░██    ░░██████
     '   '. /'   /         |   ||   '      |  '.-,.--.      ██    ████    ██████████████████    ██        ████████
     |    |'    /    __    |   |\\    \\     / / |  .-. |       ▓▓▓▓██      ██████████████████▓▓████        ██████
     |    ||    | .:--.'.  |   | \`.   \` ..' /  | |  | |   ░░  ░░████      ██▒▒▒▒▓▓██████████▒▒▒▒██        ████
     '.   \`'   .'/ |   \\ | |   |    '-...-'\`   | |  | |     ████          ██▒▒▒▒▒▒██████████▒▒▒▒██        ██
      \\        / \`" __ | | |   |               | |  '-                    ██▒▒▒▒▓▓██████████▒▒▒▒██        ██
       \\      /   .'.''| | |   |               | |                        ██▒▒▒▒▒▒▓▓██████▓▓▒▒▒▒██      ▒▒░░
        '----'   / /   | |_'---'               | |                        ██▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓██
                 \\ \\._,\\ '/                    |_|                        ░░██▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░  ██
                  \`--'  \`"                                              ████████████████████████████
  `)
      )
    )
    console.log(versionString)
  } else {
    console.log(hdr)
    console.log(chalk.bgBlue(xc(`V A L O R E Y E`)))
    console.log(versionString)
    console.log(hdr)
  }
  console.log(
    chalk.bgBlue(
      xc(`
valorant
  version | ${valorant.version}
  region  | ${valorant.region} (${valorant.regionFull})
`)
      // ports.webserver will be incorrect when printHeader is called
      //   web ui  | http://localhost:${Ports.webServer}/ (Ctrl + Click)
      // `)
    )
  )
  console.log()
}
