import React, { Component } from "react";
import { 
  Button, 
  Card,
  CardBody,
  CardHeader,
  Container, 
  ListGroup, 
  ListGroupItem, 
  Row
} from "reactstrap";
import { FaTrashAlt } from "react-icons/fa";

class QueueFeed extends Component {
  constructor(props) {
    super(props);

    this.makeListItem = this.makeListItem.bind(this);
  }

  makeListItem(video, index) {
    return (
      <ListGroupItem key={`${index} ${video.id}`}>
        <Container>
          <Row>
            {video.title}
            <Button color="danger" block onClick={(event) => this.props.removeFeed(event, index)}>
              <FaTrashAlt/>
            </Button>
          </Row>
        </Container>
      </ListGroupItem>
    );
  }

  render() {
    return (
      <Card className="text-center">
        <CardHeader>Feed</CardHeader>
        <CardBody>
          <ListGroup>
            {this.props.videos.map(this.makeListItem)}
          </ListGroup>
        </CardBody>
      </Card>
    );
  }
}

export default QueueFeed;