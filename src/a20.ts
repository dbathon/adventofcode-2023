import { lcm, p, readLines } from "./util/util";

const lines = readLines("input/a20.txt");

interface Pulse {
  high: boolean;
  source: string;
  target: string;
}

abstract class BaseModule {
  readonly inputs: string[] = [];
  constructor(
    readonly name: string,
    readonly outputs: string[]
  ) {}

  abstract pulse(pulse: Pulse): boolean | undefined;

  setInputs(inputs: string[]) {
    this.inputs.length = 0;
    this.inputs.push(...inputs);
  }
}

class Broadcaster extends BaseModule {
  pulse(pulse: Pulse) {
    return pulse.high;
  }
}

class FlipFlop extends BaseModule {
  private state: boolean = false;

  pulse(pulse: Pulse) {
    if (pulse.high) {
      return undefined;
    }
    return (this.state = !this.state);
  }
}

class Conjunction extends BaseModule {
  private readonly writtenState: Record<string, boolean> = {};

  seenHighInputs: Set<string> | undefined = undefined;

  pulse(pulse: Pulse) {
    this.writtenState[pulse.source] = pulse.high;
    if (pulse.high && this.seenHighInputs) {
      this.seenHighInputs.add(pulse.source);
    }
    return this.inputs.some((input) => !this.writtenState[input]);
  }
}

function buildModules(lines: string[]): Record<string, BaseModule> {
  const modules: Record<string, BaseModule> = {};
  const inputsMap: Record<string, string[]> = {};

  for (const line of lines) {
    const [rawName, outputsString] = line.split(" -> ");
    const outputs = outputsString.split(", ");
    let module: BaseModule;
    if (rawName === "broadcaster") {
      module = new Broadcaster(rawName, outputs);
    } else {
      const type = rawName.substring(0, 1);
      const name = rawName.substring(1);
      if (type === "%") {
        module = new FlipFlop(name, outputs);
      } else if (type === "&") {
        module = new Conjunction(name, outputs);
      } else {
        throw "error";
      }
    }
    modules[module.name] = module;
    outputs.forEach((output) => (inputsMap[output] ||= []).push(module.name));
  }

  for (const [name, inputs] of Object.entries(inputsMap)) {
    modules[name]?.setInputs(inputs);
  }

  return modules;
}

class Propagator {
  buttonPresses = 0;
  highPulses = 0;
  lowPulses = 0;

  constructor(readonly modules: Record<string, BaseModule>) {}

  pushButton(): void {
    ++this.buttonPresses;
    const pulses: Pulse[] = [{ high: false, source: "button", target: "broadcaster" }];
    while (pulses.length) {
      const pulse = pulses.shift()!;
      if (pulse.high) {
        ++this.highPulses;
      } else {
        ++this.lowPulses;
      }

      const module = this.modules[pulse.target];
      if (module) {
        const outHigh = module.pulse(pulse);
        if (outHigh !== undefined) {
          const source = module.name;
          module.outputs.forEach((target) => {
            pulses.push({ high: outHigh, source, target });
          });
        }
      }
    }
  }
}

function part1(): number {
  const propagator = new Propagator(buildModules(lines));

  for (let i = 0; i < 1000; i++) {
    propagator.pushButton();
  }

  return propagator.highPulses * propagator.lowPulses;
}

p(part1());

function part2(): number {
  const modules = buildModules(lines);
  const propagator = new Propagator(modules);

  const modulesWithRxOut = Object.values(modules).filter((module) => module.outputs.includes("rx"));
  if (modulesWithRxOut.length !== 1) {
    throw "error";
  }
  const moduleWithRxOut = modulesWithRxOut[0];
  if (!(moduleWithRxOut instanceof Conjunction)) {
    throw "error";
  }

  moduleWithRxOut.seenHighInputs = new Set();
  const seenHighInputs = moduleWithRxOut.seenHighInputs;

  const highInputSeenAt: Record<string, number> = {};

  while (true) {
    seenHighInputs.clear();
    propagator.pushButton();

    if (seenHighInputs.size) {
      for (const input of seenHighInputs) {
        if (highInputSeenAt[input] === undefined) {
          highInputSeenAt[input] = propagator.buttonPresses;

          const seenAts = Object.values(highInputSeenAt);
          if (seenAts.length === moduleWithRxOut.inputs.length) {
            return seenAts.reduce((a, b) => lcm(a, b), 1);
          }
        }
      }
    }
  }
}

p(part2());
