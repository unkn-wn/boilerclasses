import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const DEFAULT_FILTERS = {
  subjects: [],
  semesters: [],
  genEds: [],
  credits: { min: 0, max: 18 },
  levels: [100, 200, 300, 400, 500, 600, 700, 800, 900],
  scheduleTypes: [
    "Clinic",
    "Distance Learning",
    "Experiential",
    "Individual Study",
    "Laboratory",
    "Laboratory Preparation",
    "Lecture",
    "Practice Study Observation",
    "Presentation",
    "Recitation",
    "Research",
    "Studio"
  ]
};

export const CURRENT_SEMESTER = "Spring 2025";
export const PREVIOUS_SEMESTER = "Fall 2024";

export const useSearchFilters = () => {
  const router = useRouter();
  const { query } = router;

  // Combined filters state
  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
    semesters: [{ label: CURRENT_SEMESTER, value: CURRENT_SEMESTER }],
    searchTerm: query.q || '',
  });

  // UI state
  const [displayLanding, setDisplayLanding] = useState(true);
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);
  const [courses, setCourses] = useState([]);

  // Update specific filter
  const updateFilter = (filterName, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterName]: value
    }));
  };

  // Transform search query
  const transformQuery = (query) => {
    if (!query) return "";
    return query.trim()
      .replaceAll(/[-;+]/g, " ")
      .replaceAll(/[~!#%$^&*()\[\]\{\}:'<>,@=|?.`"""]/g, "")
      .replaceAll(/[–—…«»'']/g, " ")
      .replaceAll(/([a-zA-Z])(\d)/g, '$1 $2')
      .trim();
  };

  // Sync router.query into filters
  // useEffect(() => {
  //   if (Object.keys(query).length > 0) {
  //     const newFilters = { ...DEFAULT_FILTERS };

  //     if (query.q) newFilters.searchTerm = transformQuery(query.q);
  //     if (query.sub) newFilters.subjects = query.sub.split(",").map((s) => ({ label: s, value: s }));
  //     if (query.term) newFilters.semesters = query.term.split(",").map((t) => ({ label: t, value: t }));
  //     if (query.gen) newFilters.genEds = query.gen.split(",").map((g) => ({ label: g, value: g }));
  //     if (query.cmin) newFilters.credits.min = parseInt(query.cmin);
  //     if (query.cmax) newFilters.credits.max = parseInt(query.cmax);
  //     if (query.levels) newFilters.levels = query.levels.split(",").map(Number);
  //     if (query.sched) newFilters.scheduleTypes = query.sched.split(",");

  //     setFilters(newFilters);
  //   }
  // }, [query]);

  // Search function
  const search = async () => {
    const { searchTerm, subjects, semesters, genEds, credits, levels, scheduleTypes } = filters;

    if (searchTerm && searchTerm.length <= 1 && subjects.length === 0 && semesters.length === 0 && genEds.length === 0) {
      setCourses([]);
      return;
    }

    const params = new URLSearchParams({
      q: transformQuery(searchTerm),
      sub: subjects.map(x => x.value),
      term: semesters.map(x => x.value),
      gen: genEds.map(x => x.value),
      cmin: credits.min,
      cmax: credits.max,
      levels,
      sched: scheduleTypes,
      maxlim: 100
    });

    try {
      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();

      // Clean up descriptions
      const processedCourses = data.courses.documents.map(item => ({
        ...item,
        value: {
          ...item.value,
          description: item.value.description.startsWith("<a href=")
            ? "No Description Available"
            : item.value.description
        }
      }));

      setCourses(processedCourses);
    } catch (error) {
      console.error('Search failed:', error);
      setCourses([]);
    }
  };

  // Search effect
  useEffect(() => {
    search();
  }, [
    JSON.stringify(filters.subjects),
    JSON.stringify(filters.semesters),
    JSON.stringify(filters.genEds),
    transformQuery(filters.searchTerm),
    filters.credits.min,
    filters.credits.max,
    JSON.stringify(filters.levels),
    JSON.stringify(filters.scheduleTypes)
  ]);

  return {
    filters,
    updateFilter,
    displayLanding,
    setDisplayLanding,
    filtersCollapsed,
    setFiltersCollapsed,
    courses,
    transformQuery
  };
};