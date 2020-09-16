import {Component, Element, Event, EventEmitter, h, Host, Method, Prop} from '@stencil/core';
import {getScrollbarWidth} from '../../utils/utils';
import LocalScrollService from '../../services/localScrollService';
import {RevoGrid} from "../../interfaces";

@Component({
    tag: 'revogr-scroll-virtual',
    styleUrl: 'revogr-scroll-style.scss'
})
export class RevogrScrollVirtual {
    private scrollSize: number = 0;
    private isAutoHide: boolean = false;
    private autoHideTimeout: number = 0;
    private scrollService: LocalScrollService;

    @Element() element: HTMLElement;
    @Prop() dimension: RevoGrid.DimensionType = 'row';
    @Prop() contentSize: number = 0;
    @Prop() virtualSize: number = 0;

    @Event() scrollVirtual: EventEmitter<RevoGrid.ViewPortScrollEvent>;

    @Method()
    async setScroll(e: RevoGrid.ViewPortScrollEvent): Promise<void> {
        if (this.dimension !== e.dimension) {
            return;
        }
        this.scrollService?.setScroll(e);
    }

    get extContentSize(): number {
        return LocalScrollService.getVirtualContentSize(this.contentSize, this.size, this.virtualSize);
    }

    set size(s: number) {
        if (this.dimension === 'row') {
            this.element.style.minWidth = `${s}px`;
            return;
        }
        this.element.style.minHeight = `${s}px`;
    }

    get size(): number {
        if (this.dimension === 'row') {
            return this.element.clientHeight;
        }
        return this.element.clientWidth;
    }

    connectedCallback(): void {
        this.scrollService = new LocalScrollService({
            beforeScroll: e => this.scrollVirtual.emit(e),
            afterScroll: e => {
                const type = e.dimension === 'row' ? 'scrollTop' : 'scrollLeft';
                this.element[type] = e.coordinate;
            }
        });
    }

    disconnectedCallback(): void {
        clearTimeout(this.autoHideTimeout);
    }

    componentWillLoad(): void {
        this.scrollSize = getScrollbarWidth(document);
        this.isAutoHide = !this.scrollSize;
    }

    componentDidRender(): void {
        const type = this.dimension === 'row' ? 'scrollHeight' : 'scrollWidth';
        if (this.element[type] > this.size) {
            this.size = this.scrollSize;
        } else {
            this.size = 0;
        }
        this.scrollService.setParams({
            contentSize: this.contentSize,
            clientSize: this.size,
            virtualSize: this.virtualSize
        }, this.dimension);
    }

    onScroll(e: MouseEvent): void {
        let type: 'scrollLeft'|'scrollTop' = 'scrollLeft';
        if (this.dimension === 'row') {
            type = 'scrollTop';
        }
        if (this.isAutoHide) {
            this.size = 20;
            this.autoHideTimeout = this.autoHide(this.autoHideTimeout);
        }
        const target: HTMLElement = (e.target as HTMLElement);
        this.scrollService?.scroll(target[type] || 0, this.dimension);
    }

    autoHide(timeout?: number): number {
        clearTimeout(timeout);
        return setTimeout(() => {
            this.size = 0;
        }, 6000) as unknown as number;
    }

    render() {
        const sizeType = this.dimension === 'row' ? 'height' : 'width';
        return <Host {...{'auto-hide' : this.isAutoHide }} onScroll={(e: MouseEvent) => this.onScroll(e)}>
            <div style={{[sizeType]: `${this.extContentSize}px`}}/>
        </Host>;
    }
}
