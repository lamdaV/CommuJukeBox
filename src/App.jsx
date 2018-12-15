import React, { Component } from "react";
import io from "socket.io-client";
import { Col, Container, Row } from "reactstrap";
import VideoContainer from "./VideoContainer";
import MetaDataCollector from "./MetaDataCollector";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      videos: [],
      playing: null
    };

    this.socket = null;
    this.collector = new MetaDataCollector();

    this.onVideoEnd = this.onVideoEnd.bind(this);
    this.removeFeed = this.removeFeed.bind(this);
  }
  componentDidMount() {
    this.socket = io(this.props.ioAddr);
    this.socket.on("videos", (videoId) => {
      this.collector.getMeta(videoId)
        .then((response) => response.data)
        .then((data) => {
          const videos = this.state.videos;
          const playing = this.state.playing;

          if (playing) {
            videos.push({id: videoId, title: data.title});
            this.setState(videos);
          } else {
            this.setState({playing: videoId});
          }
        })
        .catch((error) => console.error(`bad videoId: ${videoId}`));
    });
  }

  componentWillUnmount() {
    this.socket.close();
    this.socket = null;
  }

  onVideoEnd(event) {
    const videos = this.state.videos;
    if (videos.length > 0) {
      const [playing, ...rest] = videos;
      if (playing.id === this.state.playing) {
        event.target.playVideo();
        this.setState({videos: rest});
      } else {
        this.setState({playing: playing.id, videos: rest});
      }
    } else {
      this.setState({playing: null});
    }
  }

  removeFeed(event, index) {
    event.preventDefault();
    const videos = this.state.videos;
    const newVideos = videos.filter((video, idx) => index !== idx);
    this.setState({videos: newVideos});
  }

  render() {
    return (
      <Container fluid>
        <Row>
          <Col>
            <VideoContainer videoId={this.state.playing}
                            onEnd={this.onVideoEnd}
                            feed={this.state.videos}
                            removeFeed={this.removeFeed}/>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default App;
