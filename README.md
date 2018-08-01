# react-aqueduct

> The bridge to convey ~~water~~ data

## Installation

```sh
npm install --save react-aqueduct
```

## Example

```js
import React from 'react';
import { createRequest } from 'react-aqueduct';

const PeopleSearch = createRequest([], ({ name }) =>
  fetch(`https://swapi.co/api/people/?search=${name}`)
    .then(response => response.json())
    .then(json => json.results),
);

const renderItem = item => <li>{item.name}</li>;

class App extends React.Component {
  state = { name: '' };

  handleChange = ({ currentTarget }) => {
    this.setState({ name: currentTarget.value });
  };

  render() {
    return (
      <section>
        <h1>Start Wars Search</h1>
        <input
          placeholder="Yoda"
          value={this.state.name}
          onChange={this.handleChange}
        />
        <PeopleSearch
          name={this.state.name}
          render={({ data, isLoading }) =>
            isLoading ? <div>Loading...</div> : <ul>{data.map(renderItem)}</ul>
          }
        />
      </section>
    );
  }
}

export default App;
```

See examples on codesanbox:

1.  [Star Wars Search](https://codesandbox.io/s/72zwxl9p0)
2.  [Star Wars Search (with updateData)](https://codesandbox.io/s/6v71pwkq7w)
