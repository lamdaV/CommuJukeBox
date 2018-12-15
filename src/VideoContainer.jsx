import React, { Component } from "react";
import { Col, Container, Jumbotron, Row } from "reactstrap";
import Youtube from "react-youtube";
import QueueFeed from "./QueueFeed";

class VideoContainer extends Component {
  render() {
    const playerOpts = {
      playerVars: {
        autoplay: 1
      }
    };

    let player;
    if (this.props.videoId) {
      player = (
        <Youtube videoId={this.props.videoId}
                 onEnd={this.props.onEnd}
                 opts={playerOpts}/>
      );
    } else {
      player = (
        <Jumbotron/>
      );
    }
   

    return (
      <Container style={{padding: "60px"}}>
        <Row>
          <Col>
            {player}
          </Col>

          <Col>
            <QueueFeed videos={this.props.feed}
                       removeFeed={this.props.removeFeed}/>
          </Col>
        </Row>
      </Container>
    )
  }
}

export default VideoContainer;