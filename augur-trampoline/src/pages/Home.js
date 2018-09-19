// @flow

import React from 'react';
import Grid from 'react-bootstrap/lib/Grid';
import Row from 'react-bootstrap/lib/Row';
import Col from 'react-bootstrap/lib/Col';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import FormControl from 'react-bootstrap/lib/FormControl';
import Panel from 'react-bootstrap/lib/Panel';
import Button from 'react-bootstrap/lib/Button';
import { LinkContainer } from 'react-router-bootstrap';
import qs from 'qs';
import nullthrows from 'nullthrows';
import '../App.css';
import TestMarketDetails from '../testenv/testmarketcomponent';

const Home = () => (
  <Grid fluid style={{ margin: '1em' }}>
    <Row>
      <Col>
        <Panel bsStyle="danger">
          <Panel.Heading>
            <Panel.Title componentClass="h3">Developers only</Panel.Title>
          </Panel.Heading>
          <Panel.Body>
            <p>
              Normally you shouldn't visit this page. If you are a user and got
              linked to this page, something went really wrong, and you should
              go back. It is way too easy to do something wrong here.
            </p>
            <p>
              Developer: this page is for a quick test of Augur Trampoline.
              Populate the fields, and get redirected to the trampoline page.
            </p>
          </Panel.Body>
        </Panel>
        <Panel>
          <Panel.Heading>
            <Panel.Title componentClass="h3">Test market</Panel.Title>
          </Panel.Heading>
          <Panel.Body>
            <TestMarketDetails />
          </Panel.Body>
        </Panel>
        <Form />
      </Col>
    </Row>
  </Grid>
);

class Form extends React.Component<*, *> {
  state: *;

  constructor(props: *) {
    super(props);
    this.state = {
      network: '',
      market: '',
      outcome: '',
      action: '',
      amount: '',
      price: '',
      creationTX: '',
    };
  }

  render() {
    const field = ({ id, label, ...props }) => (
      <FormGroup controlId={id} key={id}>
        <ControlLabel>{label}</ControlLabel>
        <FormControl
          value={this.state[id]}
          onChange={e =>
            this.setState({
              [id]: e.target.value,
            })
          }
          {...props}
        />
      </FormGroup>
    );

    const definitions = [
      {
        id: 'network',
        type: 'text',
        label: 'Network',
        placeholder: 'Rinkeby or mainnet',
      },
      {
        id: 'market',
        type: 'text',
        label: 'Market id',
        placeholder: 'starts with 0x',
      },
      {
        id: 'creationTX',
        type: 'text',
        label: 'Transaction in which the market was created',
        placeholder: 'starts with 0x',
      },
      {
        id: 'outcome',
        type: 'text',
        label: 'Outcome',
        placeholder: 'small number, starts with 0x',
      },
      {
        id: 'action',
        type: 'text',
        label: 'Action',
        placeholder: 'buy or sell',
      },
      {
        id: 'amount',
        type: 'text',
        label: 'Amount',
        placeholder: 'In contract shares (not UI shares)',
      },
      {
        id: 'price',
        type: 'text',
        label: 'limit price',
        placeholder: 'attoeth per one contract share',
      },
    ];

    const query_params = qs.stringify({
      amount: this.state.amount,
      price: this.state.price,
      // for this example make it redirect back to this form
      redirect: nullthrows(document.location.href.match(/(^[^#?]*)/))[0],
      creationTX: this.state.creationTX,
    });

    const checkout_link = `/${this.state.network}/${this.state.market}/${
      this.state.outcome
    }/${this.state.action}/${query_params}`;

    return (
      <form>
        {definitions.map(field)}
        <LinkContainer to={checkout_link}>
          <Button bsStyle="primary">Initiate transaction</Button>
        </LinkContainer>
      </form>
    );
  }
}

export default Home;
