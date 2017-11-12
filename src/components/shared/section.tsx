import * as React from 'react';

interface ISectionProps {
    sectionUrl: string;
    sectionColor: string;
    sectionName: string;
    sectionTitle: string;
    sectionRow: string;
    spikeShortName: string;
    autoRefresh: boolean;
    moreOrLessChecked: boolean;
    setMoreOrLessChecked: (sectionUrl: string, moreOrLessChecked: boolean) => void;
}

export class Section extends React.Component<ISectionProps> {
    moreOrLess = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.props.setMoreOrLessChecked(this.props.sectionUrl, event.target.checked);
    }

    render() {
        const { sectionColor, sectionUrl, sectionName, sectionTitle, sectionRow, spikeShortName, moreOrLessChecked } = this.props;

        const sectionNameLower = sectionName.toLocaleLowerCase();
        const id = `toggler-${spikeShortName}-${sectionNameLower}`;
        return (
            <section className={`link-section ${sectionNameLower}-section`} data-order={sectionRow}>
                <h2 className="col-header"><a href={sectionUrl}>
                    <svg className="logo-readspike" style={{ fill: sectionColor }}><use xlinkHref="#logo_readspike" /></svg>
                    {sectionTitle}
                </a></h2>
                <input type="checkbox" className="toggle-list" id={id} onChange={this.moreOrLess} checked={moreOrLessChecked} />
                <label htmlFor={id} className="toggler-header fadeInTogglers" style={{ opacity: 0 }}>Show/hide</label>
                <ol className={`links-list links-list--${sectionNameLower}`}>
                    {this.props.children}
                </ol>

                <label htmlFor={id} className="toggler-footer fadeInTogglers" style={{ opacity: 0 }}>Show/hide
                <svg className="icon"><use xlinkHref="#icon_arrow" /></svg>
                </label>
            </section>
        );
    }
}