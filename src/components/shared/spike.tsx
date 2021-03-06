import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { Section } from './section';
import { Header } from '../layout/header';
import { Footer } from '../layout/footer';
import { canUseDOM } from '../../canUseDOM';
import { ISpike } from '../../../src-feed-reader/interfaces';
import { getBootSpikeData, getSpikeDataBrowser, setBootSpikeData } from '../../bootData';
import { ItemTemplate } from './itemTemplate';
import { ItemTemplateBitcoin } from './itemTemplateBitcoin';

interface ISpikeProps extends RouteComponentProps<{
  spikeName: string;
}> {
}

interface IState {
  loading?: boolean;
  error?: string;
  menuOpen?: boolean;
  autoRefresh: boolean;
  moreChecked: string[];
  spikeData: ISpike;
  intervalHandle?: number;
}

const AUTOREFRESH = 'autoRefresh';

export class SpikePage extends React.Component<ISpikeProps, IState> {
  constructor(props: ISpikeProps) {
    super(props);
    const spikeName = props.match.params.spikeName || '';
    this.state = canUseDOM
      ? {
        menuOpen: false,
        autoRefresh: window.localStorage.getItem(AUTOREFRESH) === 'true',
        moreChecked: [], // JSON.parse(window.localStorage.getItem(`${spikeName}_moreChecked`) || '[]'),
        spikeData: getBootSpikeData(spikeName)
      }
      : {
        menuOpen: false,
        autoRefresh: false,
        moreChecked: [],
        spikeData: spikeName.includes('.') // TODO: Do we need this?
          ? undefined
          : getBootSpikeData(spikeName)
      };
  }

  componentDidMount() {
    // refresh once a minute
    if (this.state.autoRefresh && canUseDOM) {
      const intervalHandle = this.scheduleAutoRefresh();
      this.setState(_prevState => ({ intervalHandle }));
    }
  }

  componentWillReceiveProps(nextProps: ISpikeProps) {
    if (nextProps.match.params.spikeName !== this.props.match.params.spikeName) {
      this.loadData(nextProps.match.params.spikeName);
      this.toggleMenu();
    }
  }

  scheduleAutoRefresh = () => window.setInterval(() => this.loadData(this.props.match.params.spikeName), 60000);

  loadData(spikeName: string) {
    if (!canUseDOM) {
      return;
    }

    this.setState(_prevState => ({ loading: true }));
    getSpikeDataBrowser(spikeName)
      .then(spikeData => {
        this.setState(_prevState => ({ spikeData, loading: false }));
        setBootSpikeData(spikeData);
      })
      .catch(error => {
        this.setState(_prevState => ({ error: error.message ? error.message : error, loading: false }));
      });
  }

  setAutoRefresh = (autoRefresh: boolean) => {
    if (!canUseDOM) { return; }

    window.localStorage.setItem(AUTOREFRESH, autoRefresh ? 'true' : 'false');
    if (autoRefresh) {
      const intervalHandle = this.scheduleAutoRefresh();
      this.setState(_prevState => ({ autoRefresh, intervalHandle }));
    } else {
      window.clearInterval(this.state.intervalHandle);
      this.setState(_prevState => ({ autoRefresh, intervalHandle: undefined }));
    }
  }

  setMoreIsChecked = (sectionName: string, moreChecked: boolean) => {
    const allMoreChecked = moreChecked
      ? [...this.state.moreChecked, sectionName]
      : this.state.moreChecked.filter(checkedSectionName => checkedSectionName !== sectionName);

    // window.localStorage.setItem(`${this.props.match.params.spikeName}_moreChecked`, JSON.stringify(allMoreChecked));
    this.setState(_prevState => ({ moreChecked: allMoreChecked }));
  }

  toggleMenu = () =>
    this.setState(prevState => ({ menuOpen: !prevState.menuOpen }))

  render() {
    if (!this.state.spikeData) {
      return (<div>No data...</div>);
    }

    if (this.state.error) {
      return (<div>Problems: {this.state.error}...</div>);
    }

    const { spikeName, spikeShortName, spikeUrl, spikeHeaderBG, spikeTitle, sections, generatedAt } = this.state.spikeData;
    const col1s = sections.filter(section => section.col === '1');
    const col2s = sections.filter(section => section.col === '2');
    const col3s = sections.filter(section => section.col === '3');
    const allCols = [col1s, col2s, col3s];

    return [
      <Header
        key="head"
        spikeName={spikeName}
        spikeShortName={spikeShortName}
        spikeTitle={spikeTitle}
        spikeHeaderBG={spikeHeaderBG}
        spikeUrl={spikeUrl}
        menuOpen={this.state.menuOpen}
        loading={this.state.loading}
        toggleMenu={this.toggleMenu}
      />,
      <main key="main" className="col-group">
        {allCols.map((col, index) => (
          <div key={index} className="col">
            {col.map(section => (
              <Section
                key={section.name}
                sectionName={section.name}
                sectionColor={section.color}
                sectionTitle={section.title}
                sectionRow={section.row}
                sectionUrl={section.url}
                spikeShortName={spikeShortName}
                autoRefresh={this.state.autoRefresh}
                moreIsChecked={this.state.moreChecked}
                setMoreIsChecked={this.setMoreIsChecked}
              >
                {
                  section.error
                    ? <div>{section.error.message ? section.error.message : JSON.stringify(section.error)}</div>
                    : <ol className={`links-list links-list--${section.name.toLocaleLowerCase()}`}>
                      {section.name === 'Bitcoin'
                        ? section.dataBitcoin.map(bitcoin =>
                          <ItemTemplateBitcoin key={bitcoin.code} {...bitcoin} />)
                        : section.data.map(data =>
                          <ItemTemplate key={data.url} {...data} />)
                      }
                    </ol>
                }
              </Section>
            ))}
          </div>
        ))}
      </main>,
      <Footer key="footer" spikeName={spikeName} autoRefresh={this.state.autoRefresh} setAutoRefresh={this.setAutoRefresh} generatedAt={generatedAt} />
    ];
  }
}