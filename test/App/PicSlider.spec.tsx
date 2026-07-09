/**
 * @file PicSlider.spec.tsx
 * @description Comprehensive unit tests for PicSlider, SliderContent, and DataProvider.
 */

import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React, { useContext } from 'react';
import { vi, expect, describe, it, beforeEach, afterEach } from 'vitest';
import { Isettings, PicSlider, SliderContent } from 'src/App/PicSlider';
import { DataContext, DataProvider, Ipic } from 'src/providers/Data.provider';

const mockPics: Ipic[] = [
  {
    _id: '1',
    url: '/imgs/slide1.png',
    title: 'Slide 1 Caption',
    comments: 'showCaption',
    type: 'tim-pic',
    caption: '',
    thumbnail: undefined,
    link: '',
    modify: undefined,
  },
  {
    _id: '2',
    url: '/imgs/slide2.png',
    title: 'Slide 2 Caption',
    comments: 'hideCaption',
    type: 'tim-pic',
    caption: '',
    thumbnail: undefined,
    link: '',
    modify: undefined,
  },
  {
    _id: '3',
    url: '/imgs/slide3.png',
    title: 'Slide 3 Caption',
    comments: 'showCaption',
    type: 'tim-pic',
    caption: '',
    thumbnail: undefined,
    link: '',
    modify: undefined,
  },
];

const mockSettings: Isettings = {
  autoplay: true,
  autoplaySpeed: 3000,
  infinite: true,
  speed: 1000,
  slidesToShow: 1,
  slidesToScroll: 1,
  arrows: true,
  fade: true,
};

describe('picture slider component tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('is defined', () => {
    expect(PicSlider).toBeDefined();
    expect(SliderContent).toBeDefined();
  });

  it('renders nothing when pics is null or empty', () => {
    const { container: containerNull } = render(<SliderContent pics={null} settings={mockSettings} />);
    expect(containerNull.firstChild).toBeNull();

    const { container: containerEmpty } = render(<SliderContent pics={[]} settings={mockSettings} />);
    expect(containerEmpty.firstChild).toBeNull();
  });

  it('renders SliderContent when having pics', () => {
    const { container } = render(<SliderContent pics={mockPics} settings={mockSettings} />);
    expect(container.querySelector('.slick-list')).toBeInTheDocument();
    expect(container.querySelector('.picSlider')).toBeInTheDocument();

    // First slide should be active and display caption
    const activeSlide = container.querySelector('.slide-item.active');
    expect(activeSlide).toBeInTheDocument();
    expect(screen.getByText('Slide 1 Caption')).toBeInTheDocument();
  });

  it('navigates next and previous correctly', () => {
    render(<SliderContent pics={mockPics} settings={mockSettings} />);

    const nextBtn = screen.getByLabelText('Next Slide');
    const prevBtn = screen.getByLabelText('Previous Slide');

    // Go to next slide
    fireEvent.click(nextBtn);
    expect(screen.queryByText('Slide 1 Caption')).not.toBeInTheDocument();

    // Go to next slide again (Slide 3 has caption showCaption)
    fireEvent.click(nextBtn);
    expect(screen.getByText('Slide 3 Caption')).toBeInTheDocument();

    // Go next again -> loops back to 1 (infinite is true)
    fireEvent.click(nextBtn);
    expect(screen.getByText('Slide 1 Caption')).toBeInTheDocument();

    // Go previous -> loops to 3
    fireEvent.click(prevBtn);
    expect(screen.getByText('Slide 3 Caption')).toBeInTheDocument();

    // Go previous again to slide 2
    fireEvent.click(prevBtn);
    // Slide 2 has comments: 'hideCaption' so it should not render a caption
    expect(screen.queryByText('Slide 2 Caption')).not.toBeInTheDocument();
  });

  it('respects infinite=false setting', () => {
    const finiteSettings = { ...mockSettings, infinite: false };
    render(<SliderContent pics={mockPics} settings={finiteSettings} />);

    const prevBtn = screen.getByLabelText('Previous Slide');
    const nextBtn = screen.getByLabelText('Next Slide');

    // Try going previous from slide 1 (index 0) - should stay at 0
    fireEvent.click(prevBtn);
    expect(screen.getByText('Slide 1 Caption')).toBeInTheDocument();

    // Go to last slide
    fireEvent.click(nextBtn);
    fireEvent.click(nextBtn);
    expect(screen.getByText('Slide 3 Caption')).toBeInTheDocument();

    // Try going next from last slide (index 2) - should stay at 2
    fireEvent.click(nextBtn);
    expect(screen.getByText('Slide 3 Caption')).toBeInTheDocument();
  });

  it('handles dot clicks to jump to specific slides', () => {
    render(<SliderContent pics={mockPics} settings={mockSettings} />);

    const dot3 = screen.getByLabelText('Go to slide 3');
    fireEvent.click(dot3);

    expect(screen.getByText('Slide 3 Caption')).toBeInTheDocument();
  });

  it('supports autoplay intervals', () => {
    render(<SliderContent pics={mockPics} settings={mockSettings} />);

    expect(screen.getByText('Slide 1 Caption')).toBeInTheDocument();

    // Advance by autoplay duration (3000ms)
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Should now be on slide 2 (no caption)
    expect(screen.queryByText('Slide 1 Caption')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Should now be on slide 3
    expect(screen.getByText('Slide 3 Caption')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Loops back to slide 1
    expect(screen.getByText('Slide 1 Caption')).toBeInTheDocument();
  });

  it('stops autoplay loop at end if infinite is false', () => {
    const finiteAutoplaySettings = { ...mockSettings, infinite: false };
    render(<SliderContent pics={mockPics} settings={finiteAutoplaySettings} />);

    expect(screen.getByText('Slide 1 Caption')).toBeInTheDocument();

    // Advance 3 steps
    act(() => {
      vi.advanceTimersByTime(3000); // -> slide 2
    });
    act(() => {
      vi.advanceTimersByTime(3000); // -> slide 3
    });
    expect(screen.getByText('Slide 3 Caption')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000); // -> stays at slide 3
    });
    expect(screen.getByText('Slide 3 Caption')).toBeInTheDocument();
  });

  it('renders PicSlider utilizing DataContext', () => {
    const TestComponent = () => {
      return (
        <DataContext.Provider value={{ pics: mockPics, setPics: () => {}, gigs: null, setGigs: () => {} }}>
          <PicSlider />
        </DataContext.Provider>
      );
    };

    render(<TestComponent />);
    expect(screen.getByText('Slide 1 Caption')).toBeInTheDocument();
  });
});

describe('DataProvider component tests', () => {
  let fetchSpy: any;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches pics on mount and updates state', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPics,
    } as Response);

    const ConsumerComponent = () => {
      const { pics } = useContext(DataContext);
      return (
        <div>
          {pics ? <div data-testid="pics-loaded">{pics.length} pics</div> : <div data-testid="loading">loading</div>}
        </div>
      );
    };

    render(
      <DataProvider>
        <ConsumerComponent />
      </DataProvider>
    );

    expect(screen.getByTestId('loading')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('pics-loaded')).toBeInTheDocument();
      expect(screen.getByText('3 pics')).toBeInTheDocument();
    });

    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/book?artist=tim'));
  });

  it('handles fetch non-ok response gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    render(
      <DataProvider>
        <div />
      </DataProvider>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    consoleSpy.mockRestore();
  });

  it('handles fetch network failure gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchSpy.mockRejectedValueOnce(new Error('Network failure'));

    render(
      <DataProvider>
        <div />
      </DataProvider>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    consoleSpy.mockRestore();
  });
});
