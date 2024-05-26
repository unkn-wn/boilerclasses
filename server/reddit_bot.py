import praw
import re
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../.env'))

reddit = praw.Reddit(
    client_id=os.getenv('CLIENT_ID'),
    client_secret=os.getenv('CLIENT_SECRET'),
    username=os.getenv('REDDIT_USERNAME'),
    password=os.getenv('REDDIT_PASSWORD'),
    user_agent=os.getenv('USER_AGENT')
)

course_pattern = re.compile(r'\b[A-Za-z]{2,4}\s?\d{2,5}\b', re.IGNORECASE)

subreddit = reddit.subreddit("testingground4bots")
for submission in subreddit.stream.submissions(skip_existing=True):
    match = course_pattern.search(submission.title)
    if match:
        course_mentioned = match.group()
        try:
            # submission.reply("Course mentioned in the title.")
            print(f"Replied to: {submission.title}, Course mentioned: {course_mentioned}")
        except Exception as e:
            print(f"Error: {e}")
