declare module '@3d-dice/dice-box' {
  interface DiceBoxOptions {
    assetPath?: string;
    scale?: number;
    theme?: string;
    offscreen?: boolean;
    gravity_multiplier?: number;
    mass?: number;
    friction?: number;
    restitution?: number;
    linear_damping?: number;
    angular_damping?: number;
    spin_force?: number;
    throw_force?: number;
    starting_height?: number;
    settle_time?: number;
    light_intensity?: number;
    enable_shadows?: boolean;
    shadow_transparency?: number;
    sounds?: boolean;
    sound_volume?: number;
  }

  interface DieRollResult {
    value: number;
    sides: number;
    themeColor?: string;
    // Add other properties if known
  }

  class DiceBox {
    constructor(selector: string | HTMLElement, options?: DiceBoxOptions);
    init(): Promise<void>;
    roll(dice: string | Array<{ sides: number; themeColor?: string }> | any): Promise<DieRollResult[]>;
    clear(): void;
    resize(): void;
    // Add other methods/properties if needed
  }

  export default DiceBox;
}
