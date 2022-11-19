import {
  bool,
  createTypeHelper,
  defaultTypeConverters,
  string,
  switchOption,
  TypeConversionError,
} from "@chiruso/knub-command-manager";
import { disableCodeBlocks } from "../../helpers";
import { getChannelId, getRoleId, getUserId } from "../../utils";
import { Channel, ChannelType, GuildMember, GuildTextBasedChannel, Role, User, VoiceChannel } from "discord.js";
import { AnyPluginData } from "../../plugins/PluginData";
import { CommandContext } from "./messageCommandUtils";

// TODO: Remove eslint-disable below after `this: void` has been added to the functions in knub-command-manager
/* eslint-disable @typescript-eslint/unbound-method */

export const messageCommandBaseTypeConverters = {
  ...defaultTypeConverters,

  boolean: defaultTypeConverters.bool,

  number(value: string): number {
    const result = parseFloat(value);
    if (Number.isNaN(result)) {
      throw new TypeConversionError(`\`${disableCodeBlocks(value)}\` no es un número válido`);
    }

    return result;
  },

  user(value: string, { pluginData: { client } }: CommandContext<AnyPluginData<any>>): User {
    const userId = getUserId(value);
    if (!userId) {
      throw new TypeConversionError(`\`${disableCodeBlocks(value)}\` no es un usuario válido`);
    }

    const user = client.users.cache.get(userId);
    if (!user) {
      throw new TypeConversionError(`No se encontró un usuario con la ID \`${userId}\``);
    }

    return user;
  },

  member(value: string, { message, pluginData: { client } }: CommandContext<AnyPluginData<any>>): GuildMember {
    if (message.channel.type === ChannelType.DM) {
      throw new TypeConversionError(`'Member' solo puede ser utilizado en servidores`);
    }

    const userId = getUserId(value);
    if (!userId) {
      throw new TypeConversionError(`\`${disableCodeBlocks(value)}\` no es un usuario válido`);
    }

    const user = client.users.cache.get(userId);
    if (!user) {
      throw new TypeConversionError(`No se encontró un usuario con la ID \`${userId}\``);
    }

    const member = message.channel.guild.members.cache.get(user.id);
    if (!member) {
      throw new TypeConversionError(`No se encontró un miembro del servidor con la ID \`${userId}\``);
    }

    return member;
  },

  channel(value: string, { message }: CommandContext<AnyPluginData<any>>): Channel {
    if (message.channel.type === ChannelType.DM) {
      throw new TypeConversionError(`'Channel' solo puede ser utilizado en servidores`);
    }

    const channelId = getChannelId(value);
    if (!channelId) {
      throw new TypeConversionError(`\`${disableCodeBlocks(value)}\` no es un canal válido`);
    }

    const guild = message.channel.guild;
    const channel = guild.channels.cache.get(channelId);
    if (!channel) {
      throw new TypeConversionError(`No se encontró un canal con la ID \`${channelId}\``);
    }

    return channel;
  },

  textChannel(value: string, { message }: CommandContext<AnyPluginData<any>>): GuildTextBasedChannel {
    if (message.channel.type === ChannelType.DM) {
      throw new TypeConversionError(`'textChannel' solo puede ser utilizado en servidores`);
    }

    const channelId = getChannelId(value);
    if (!channelId) {
      throw new TypeConversionError(`\`${disableCodeBlocks(value)}\` no es un canal válido`);
    }

    const guild = message.channel.guild;
    const channel = guild.channels.cache.get(channelId);
    if (!channel) {
      throw new TypeConversionError(`No se encontró un canal con la ID \`${channelId}\``);
    }

    if (!channel.isTextBased()) {
      throw new TypeConversionError(`El canal \`${channel.name}\` no es un canal de texto`);
    }

    return channel;
  },

  voiceChannel(value: string, { message }: CommandContext<AnyPluginData<any>>): VoiceChannel {
    if (message.channel.type === ChannelType.DM) {
      throw new TypeConversionError(`'voiceChannel' solo puede ser utilizado en servidores`);
    }

    const channelId = getChannelId(value);
    if (!channelId) {
      throw new TypeConversionError(`\`${disableCodeBlocks(value)}\` no es un canal válido`);
    }

    const guild = message.channel.guild;
    const channel = guild.channels.cache.get(channelId);
    if (!channel) {
      throw new TypeConversionError(`No se encontró un canal con la ID \`${channelId}\``);
    }

    if (channel.type !== ChannelType.GuildVoice) {
      throw new TypeConversionError(`El canal \`${channel.name}\` no es un canal de voz`);
    }

    return channel;
  },

  role(value: string, { message }: CommandContext<AnyPluginData<any>>): Role {
    if (message.channel.type === ChannelType.DM) {
      throw new TypeConversionError(`'Role' solo puede ser utilizado en servidores`);
    }

    const roleId = getRoleId(value);
    if (!roleId) {
      throw new TypeConversionError(`\`${disableCodeBlocks(value)}\` no es un rol válido`);
    }

    const role = message.channel.guild.roles.cache.get(roleId);
    if (!role) {
      throw new TypeConversionError(`No se encontró un rol con la ID \`${roleId}\``);
    }

    return role;
  },

  userId(value: string): string {
    const userId = getUserId(value);
    if (!userId) {
      throw new TypeConversionError(`\`${disableCodeBlocks(value)}\` no es un usuario válido`);
    }

    return userId;
  },

  channelId(value: string): string {
    const channelId = getChannelId(value);
    if (!channelId) {
      throw new TypeConversionError(`\`${disableCodeBlocks(value)}\` no es un canal válido`);
    }

    return channelId;
  },
};

export const baseCommandParameterTypeHelpers = {
  // knub-command-manager defaults
  string,
  bool,
  switchOption,

  // Knub-specific types
  // knub-command-manager also has a number() helper, but we have slightly different error handling here
  number: createTypeHelper<number>(messageCommandBaseTypeConverters.number),
  user: createTypeHelper<User>(messageCommandBaseTypeConverters.user),
  member: createTypeHelper<GuildMember>(messageCommandBaseTypeConverters.member),
  channel: createTypeHelper<Channel>(messageCommandBaseTypeConverters.channel),
  textChannel: createTypeHelper<GuildTextBasedChannel>(messageCommandBaseTypeConverters.textChannel),
  voiceChannel: createTypeHelper<VoiceChannel>(messageCommandBaseTypeConverters.voiceChannel),
  role: createTypeHelper<Role>(messageCommandBaseTypeConverters.role),
  userId: createTypeHelper<string>(messageCommandBaseTypeConverters.userId),
  channelId: createTypeHelper<string>(messageCommandBaseTypeConverters.channelId),
};
