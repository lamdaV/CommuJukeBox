import axios from "axios";

class MetaDataCollector {
  constructor() {
    this.service = axios.create({baseURL: "https://noembed.com"});
  }

  getMeta(videoId) {
    const options = {
      params: {
        url: `https://youtube.com/watch?v=${videoId}`
      }
    };
    return this.service.get("/embed", options);
  }
}

export default MetaDataCollector;