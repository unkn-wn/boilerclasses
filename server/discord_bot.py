import discord
import os
from dotenv import load_dotenv

load_dotenv()

client = discord.Client()


# content:
# { "submission_title": string
#   "courses_mentioned": [{
#       "name": string,
#       "url": string,
#   }]
#   "reddit_url": string
# }
async def send_msg(content):
    await client.wait_until_ready()
    channel = client.get_channel(1265834194089545758)

    message = f"# {content['submission_title']}\n> {content['reddit_url']}\n\nFound these courses:\n"

    for course in content["courses_mentioned"]:
        message += f"**{course['name']}** - {course['url']}\n"

    await channel.send(message)

async def send_single_msg(message):
    await client.wait_until_ready()
    channel = client.get_channel(1265834194089545758)
    await channel.send(message)


@client.event
async def on_ready():
    print("Logged in as")
    print(client.user.name)
    print(client.user.id)
    print("------")
    # await send_msg("Hello, I am online!")

def start_bot():
    client.run(os.getenv("DISCORD_TOKEN"))
