import praw
import re
import os
import requests
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

reddit = praw.Reddit(
    client_id=os.getenv("CLIENT_ID"),
    client_secret=os.getenv("CLIENT_SECRET"),
    username=os.getenv("REDDIT_USERNAME"),
    password=os.getenv("REDDIT_PASSWORD"),
    user_agent=os.getenv("USER_AGENT"),
)

course_pattern = re.compile(r"\b[A-Za-z]{2,4}\s?\d{2,5}\b", re.IGNORECASE)

latest_sem = "Fall 2024"

subreddit = reddit.subreddit("testingground4bot")

for submission in subreddit.stream.submissions(skip_existing=True):
    matches = course_pattern.findall(submission.title)

    # remove duplicates
    matches = list(dict.fromkeys(matches))

    if matches:
        print("\n\n--------\n\n")
        reply_text = "### Mentioned courses: \n"
        found = False

        for course_mentioned in matches:
            try:
                # split course in format of "ece323" to "ece 323"
                course_mentioned = re.sub(
                    r"([a-zA-Z]+)(\d+)", r"\1 \2", course_mentioned
                )

                # if course has only 3 numbers, add 2 zeroes to the end
                course_number = course_mentioned.split(" ")[1]
                if len(course_number) == 3:
                    course_mentioned += "00"

                print("SEARCHING FOR COURSE: ", course_mentioned + "\n\n")

                # get course info from API
                url = f"https://boilerclasses.com/api/search?q={course_mentioned}&sub=&term={latest_sem}&gen=&cmin=0&cmax=18&levels=100%2C200%2C300%2C400%2C500%2C600%2C700%2C800%2C900&sched=Clinic%2CDistance+Learning%2CExperiential%2CIndividual+Study%2CLaboratory%2CLaboratory+Preparation%2CLecture%2CPractice+Study+Observation%2CPresentation%2CRecitation%2CResearch%2CStudio"
                response = requests.get(url)
                course_info = response.json()
                print(url + "\n\n")

                # check if course exists
                if course_info["courses"]["total"] == 0:
                    print(f"No courses: {course_mentioned}")
                    continue

                # check if the search result was accurate
                result_course = course_info["courses"]["documents"][0]["value"]
                result_course_code = result_course["subjectCode"] + " " + str(result_course["courseCode"])
                if course_mentioned.upper() != result_course_code:
                    print(f"Course result was bad: {course_mentioned} != {result_course_code}")
                    continue

                detailId = result_course["detailId"]
                course_url = f"https://www.boilerclasses.com/detail/{detailId}"

                reply_text += f"[{course_mentioned.upper()}]({course_url})\n\n"
                found = True

                print(f"Found: {course_mentioned.upper()} - {course_url}\n\n")
            except Exception as e:
                found = False
                print(f"Error: {e}")

        reply_text += (
            "\n^I ^am ^a ^bot. ^Please ^contact ^this ^account ^for ^any ^issues."
        )

        if found:
            submission.reply(reply_text)
            print(f"Reply: {reply_text}")
