package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
)

type Course struct {
	ID      int    `json:"id"`
	Subject string `json:"subject"`
	Course  int    `json:"course"`
	Name    string `json:"name"`
	Data    string `json:"data"`
}

type RMPInfo struct {
	// Define fields based on your RMPInfo structure
}

func fetchCourses() ([]Course, error) {
	resp, err := http.Get("https://selfservice.mypurdue.purdue.edu/prod/bwckschd.p_disp_dyn_sched")
	if err != nil {
		return nil, fmt.Errorf("failed to fetch courses: %w", err)
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	// Parse the HTML response to extract course data (you may need to use a library like goquery)
	courses := parseCourses(body)

	return courses, nil
}

func parseCourses(body []byte) []Course {
	// Implement parsing logic here
	// This is a placeholder for actual parsing logic
	return []Course{
		{ID: 1, Subject: "CS", Course: 101, Name: "Introduction to Computer Science", Data: "{}"},
	}
}

func main() {
	courses, err := fetchCourses()
	if err != nil {
		log.Fatalf("Error fetching courses: %v", err)
	}

	// Output courses as JSON
	jsonData, err := json.MarshalIndent(courses, "", "  ")
	if err != nil {
		log.Fatalf("Error marshaling JSON: %v", err)
	}

	fmt.Println(string(jsonData))
}
