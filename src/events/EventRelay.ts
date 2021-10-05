import { EventArguments, ExtendedClientEvents, fromDjsArgs, GuildEvent, isGuildEvent, ValidEvent } from "./eventTypes";
import { eventToGuild } from "./eventUtils";
import { Client, ClientEvents } from "discord.js";
import { Profiler } from "../Profiler";
import { performance } from "perf_hooks";

export type RelayListener<TEvent extends ValidEvent> = (args: EventArguments[TEvent]) => any;
type GuildListenerMap = Map<string, Map<GuildEvent, Set<RelayListener<GuildEvent>>>>;
type AnyListenerMap = Map<ValidEvent, Set<RelayListener<ValidEvent>>>;

/**
 * Relays Discord events to the appropriate plugins.
 * Guild events are a subset of all events, that apply to a specific guild.
 */
export class EventRelay {
  protected guildListeners: GuildListenerMap = new Map() as GuildListenerMap;
  protected anyListeners: AnyListenerMap = new Map() as AnyListenerMap;
  protected registeredRelays: Set<ValidEvent> = new Set();

  constructor(protected client: Client, protected profiler: Profiler) {}

  onGuildEvent<TEvent extends GuildEvent>(guildId: string, ev: TEvent, listener: RelayListener<TEvent>): void {
    if (!this.guildListeners.has(guildId)) {
      this.guildListeners.set(guildId, new Map());
    }

    const guildListeners = this.guildListeners.get(guildId)!;
    if (!guildListeners.has(ev)) {
      guildListeners.set(ev, new Set());
    }

    guildListeners.get(ev)!.add(listener as RelayListener<GuildEvent>);
    this.registerEventRelay(ev);
  }

  offGuildEvent<TEvent extends GuildEvent>(guildId: string, ev: TEvent, listener: RelayListener<TEvent>): void {
    this.guildListeners
      .get(guildId)
      ?.get(ev)
      ?.delete(listener as RelayListener<GuildEvent>);
  }

  onAnyEvent<TEvent extends ValidEvent>(ev: TEvent, listener: RelayListener<TEvent>): void {
    if (!this.anyListeners.has(ev)) {
      this.anyListeners.set(ev, new Set());
    }

    this.anyListeners.get(ev)!.add(listener as RelayListener<ValidEvent>);
    this.registerEventRelay(ev);
  }

  offAnyEvent<TEvent extends ValidEvent>(ev: TEvent, listener: RelayListener<TEvent>): void {
    if (!this.anyListeners.has(ev)) {
      return;
    }

    this.anyListeners.get(ev)!.delete(listener as RelayListener<ValidEvent>);
  }

  protected registerEventRelay(ev: ValidEvent): void {
    if (this.registeredRelays.has(ev)) {
      return;
    }

    this.registeredRelays.add(ev);
    this.client.on(ev as keyof ClientEvents, (...args) => {
      this.relayEvent(ev, args);
    });
  }

  protected relayEvent(ev: ValidEvent, args: ExtendedClientEvents[ValidEvent]): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
    const convertedArgs = (fromDjsArgs[ev] as any)?.(...args);

    if (isGuildEvent(ev)) {
      // Only guild events are passed to guild listeners, and only to the matching guild
      const guild = eventToGuild[ev]?.(convertedArgs);
      if (guild && this.guildListeners.get(guild.id)?.has(ev)) {
        for (const listener of this.guildListeners.get(guild.id)!.get(ev)!.values()!) {
          const startTime = performance.now();
          const result: unknown = listener(convertedArgs as EventArguments[GuildEvent]);
          void Promise.resolve(result).then(() => {
            this.profiler.addDataPoint(`event:${ev}`, performance.now() - startTime);
          });
        }
      }
    }

    // Guild events and global events are both passed to "any listeners"
    if (this.anyListeners.has(ev)) {
      for (const listener of this.anyListeners.get(ev)!.values()) {
        const startTime = performance.now();
        const result: unknown = listener(convertedArgs);
        void Promise.resolve(result).then(() => {
          this.profiler.addDataPoint(`event:${ev}`, performance.now() - startTime);
        });
      }
    }
  }
}
