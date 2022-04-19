import useSWR from 'swr';

const fetcher = (...args) => fetch(...args).then(res => res.json());

export function useUser() {
  const { data, error, mutate } = useSWR("/api/auth/me", fetcher, { revalidateOnMount: true });

  return {
    user: data?.user,
    mutateUser: mutate,
    isLoading: !error && !data,
    isError: error,
    logout() {
      return new Promise(res => {
        fetch("/api/auth/logout").then(() => {
          mutate();
          res();
        })
      })
    },
    login() {
      return new Promise(res => {
        window.location = "https://discord.com/api/oauth2/authorize?" + [
          "response_type=code",
          "client_id=" + process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID,
          "scope=" + ["identify", process.env.NEXT_PUBLIC_DISCORD_GUILD_REQUIRED && "guilds"].filter(a => a).join("%20"),
          "redirect_uri=" + process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI
        ].join("&");
      })
    }
  }
}
