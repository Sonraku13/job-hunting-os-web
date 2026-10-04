const CONFIG = {

  ZAPI_KEY:
    PropertiesService
    .getScriptProperties()
    .getProperty("ZAPI_KEY"),


  ZAPI_BASE_URL:
    "https://api.zapi.ink/v1",


  GEMINI_KEY:
    PropertiesService
    .getScriptProperties()
    .getProperty("GEMINI_API_KEY"),


  SEARCH_QUERY:
    "Graphic Designer",


  LOCATION:
    "Jakarta",


  AI_TEMPERATURE:
    0.4,


  AI_MAX_RETRY:
    3,


  SHEETS: {
  JOBS: "JOBS",
  PROFILE: "PROFILE",
  APPLICATIONS: "APPLICATIONS",
  SETTINGS: "SETTINGS",
  MANUAL_POSTS: "MANUAL_POSTS"
}

};