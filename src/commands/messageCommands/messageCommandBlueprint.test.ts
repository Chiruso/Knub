import { number, string } from "@chiruso/knub-command-manager";
import { expect } from "chai";
import { BasePluginType } from "../../index";
import { guildPluginMessageCommand, globalPluginMessageCommand } from "./messageCommandBlueprint";
import { DMChannel, TextChannel } from "discord.js";

type AssertEquals<TActual, TExpected> = TActual extends TExpected ? true : false;

describe("guildPluginMessageCommand() helper", () => {
  it("(blueprint)", () => {
    const blueprint = guildPluginMessageCommand({
      trigger: "cmd",
      permission: null,
      signature: {
        foo: string(),
        bar: number(),
      },
      run({ args }) {
        // Test type inference
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const result: AssertEquals<typeof args, { foo: string; bar: number }> = true;
      },
    });

    expect(blueprint.trigger).to.equal("cmd");
    expect(blueprint.signature).to.eql({ foo: string(), bar: number() });
    expect(blueprint.run).to.not.equal(undefined);
  });

  interface CustomPluginType extends BasePluginType {
    state: {
      foo: 5;
    };
  }

  it("<TPluginType>()(blueprint)", () => {
    const blueprint = guildPluginMessageCommand<CustomPluginType>()({
      trigger: "cmd",
      permission: null,
      signature: {
        foo: string(),
        bar: number(),
      },
      run({ args, pluginData }) {
        // Test type inference
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const result: AssertEquals<typeof args, { foo: string; bar: number }> = true;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const result2: AssertEquals<typeof pluginData.state.foo, 5> = true;
      },
    });

    expect(blueprint.trigger).to.equal("cmd");
    expect(blueprint.signature).to.eql({ foo: string(), bar: number() });
    expect(blueprint.run).to.not.equal(undefined);
  });

  it("command message is a guild message", () => {
    guildPluginMessageCommand({
      trigger: "foo",
      permission: null,
      run({ message }) {
        // Make sure message.member cannot be null
        // https://github.com/microsoft/TypeScript/issues/29627#issuecomment-458329399
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const result: null extends typeof message.member ? false : true = true;

        // Make sure message.channel is always a textable guild channel and cannot be a private channel
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const result2: DMChannel extends typeof message.channel
          ? false
          : TextChannel extends typeof message.channel
          ? true
          : false = true;
      },
    });
  });

  it("args type inference for multiple signatures", () => {
    guildPluginMessageCommand({
      trigger: "cmd",
      permission: null,
      signature: [
        {
          foo: string(),
          bar: number(),
        },
        {
          baz: number(),
        },
      ],
      run({ args }) {
        if (args.foo != null) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const x: number = args.bar; // args.bar cannot be undefined
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const y: undefined = args.baz; // args.baz must be undefined
        }

        if (args.baz != null) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const x: number = args.baz; // args.baz cannot be undefined
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const y: undefined = args.bar; // args.bar must be undefined
        }
      },
    });
  });
});

describe("globalPluginMessageCommand() helper", () => {
  it("(blueprint)", () => {
    const blueprint = globalPluginMessageCommand({
      trigger: "cmd",
      permission: null,
      signature: {
        foo: string(),
        bar: number(),
      },
      run({ args }) {
        // Test type inference
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const result: AssertEquals<typeof args, { foo: string; bar: number }> = true;
      },
    });

    expect(blueprint.trigger).to.equal("cmd");
    expect(blueprint.signature).to.eql({ foo: string(), bar: number() });
    expect(blueprint.run).to.not.equal(undefined);
  });

  interface CustomPluginType extends BasePluginType {
    state: {
      foo: 5;
    };
  }

  it("<TPluginType>()(blueprint)", () => {
    const blueprint = globalPluginMessageCommand<CustomPluginType>()({
      trigger: "cmd",
      permission: null,
      signature: {
        foo: string(),
        bar: number(),
      },
      run({ args, pluginData }) {
        // Test type inference
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const result: AssertEquals<typeof args, { foo: string; bar: number }> = true;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const result2: AssertEquals<typeof pluginData.state.foo, 5> = true;
      },
    });

    expect(blueprint.trigger).to.equal("cmd");
    expect(blueprint.signature).to.eql({ foo: string(), bar: number() });
    expect(blueprint.run).to.not.equal(undefined);
  });

  it("command message is NOT necessarily a guild message", () => {
    globalPluginMessageCommand({
      trigger: "foo",
      permission: null,
      run({ message }) {
        // If the message is not necessarily a guild message, the member can be null
        // https://github.com/microsoft/TypeScript/issues/29627#issuecomment-458329399
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const result: null extends typeof message.member ? true : false = true;

        // If the message is not necessarily a guild message, the channel can be a private channel
        // as well as a guild channel.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const result2: DMChannel extends typeof message.channel
          ? TextChannel extends typeof message.channel
            ? true
            : false
          : false = true;
      },
    });
  });
});
