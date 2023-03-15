const prettify = ({
  data: {
    inn, kpp, type, name: { full_with_opf, short_with_opf }, address: { value },
  },
}) => ({
  type,
  name_short: short_with_opf,
  name_full: full_with_opf,
  inn_kpp: `${inn} / ${kpp}`,
  address: value,
});

const getData = async (query) => {
  const url = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party";
  const token = "e4d9f87635ba45611273fceca7e8e434c2f22248";

  const options = {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({ query }),
  };

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error(error);
    return {};
  }
};

function typeDescription(type) {
  var TYPES = {
    'INDIVIDUAL': 'Индивидуальный предприниматель',
    'LEGAL': 'Организация'
  }
  return TYPES[type];
}

class PartyComponent extends HTMLElement {
  constructor() {
    super();

    
    const moduleTemplate = document.createElement('template');
    moduleTemplate.innerHTML = `

      <style>
        input {
          font-size: 16px;
          padding: 4px 0;
          width: 100%;
        }
        
        @media screen and (max-width: 600px) {
          input {
            font-size: 12px;
          }
        }

        .container,
        .result {
          width: 100%;
        }
        
        .row {
          margin-top: 1em;
        }
        
        .row label {
          display: block;
          min-width: 10em;
        }
      </style>


      <section class="container">
          <p><strong>Компания или ИП</strong></p>
          <input id="party" name="party" type="text" list="datalist" placeholder="Введите название, ИНН, ОГРН или адрес организации" />
          <datalist id="datalist"></datalist>
          </div>
      </section>

      <section class="result">
          <p id="type"></p>
          <div class="row">
              <label>Краткое наименование</label>
              <input id="name_short">
          </div>
          <div class="row">
              <label>Полное наименование</label>
              <input id="name_full">
          </div>
          <div class="row">
              <label>ИНН / КПП</label>
              <input id="inn_kpp">
          </div>
          <div class="row">
              <label>Адрес</label>
              <input id="address">
          </div>
      </section>
    `;

    this.attachShadow({mode: 'open'});
    this.shadowRoot.appendChild(moduleTemplate.content.cloneNode(true));

    this.partyInput = this.shadowRoot.querySelector('#party');
    this.typeString = this.shadowRoot.querySelector('#type');
    this.requisites = this.shadowRoot.querySelectorAll('.result input');
    this.datalist = this.shadowRoot.querySelector('datalist');

    this.partyInput.addEventListener('input', async (event) => {
      const { value } = event.target;
      const { suggestions } = await getData(value);
      this.suggestions = suggestions;
      this.renderDatalist();
    });

    this.partyInput.addEventListener('change', (event) => {
      [this.selectedCompany] = this.suggestions
        .filter(({ value }) => value === event.target.value)
        .map(prettify);
      if (this.selectedCompany) {
        this.renderRequisites();
      }
    });
  }

  renderDatalist() {
    this.datalist.innerHTML = '';
    this.suggestions.forEach(({ value: name, data: { inn, address: { value } } }) => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = `${inn} ${value}`;
      this.datalist.append(option);
    });
  }

  renderRequisites() {
    this.typeString.textContent = `
      ${typeDescription(this.selectedCompany.type)} (${this.selectedCompany.type})
    `;
    this.requisites.forEach((input) => {
      const { id } = input;
      input.value = this.selectedCompany[id];
    });
    this.partyInput.blur();
  }
}

  customElements.define('party-component', PartyComponent);