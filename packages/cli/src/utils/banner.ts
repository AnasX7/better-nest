import pc from 'picocolors'

export function printBanner() {
  const logo = [
    pc.red('  ____       _   _              _   _           _   '),
    pc.magenta(' | __ )  ___| |_| |_ ___ _ __  | \\ | | ___  ___| |_ '),
    pc.blue(" |  _ \\ / _ \\ __| __/ _ \\ '__| |  \\| |/ _ \\/ __| __|"),
    pc.cyan(' | |_) |  __/ |_| ||  __/ |    | |\\  |  __/\\__ \\ |_ '),
    pc.green(' |____/ \\___|\\__|\\__\\___|_|    |_| \\_|\\___||___/\\__|'),
  ].join('\n')

  console.log('\n' + logo + '\n')
  console.log(
    pc.bold(pc.white(' Better-Nest')) +
      pc.dim(' - Production-grade NestJS scaffolding with modern TypeScript\n'),
  )
}
